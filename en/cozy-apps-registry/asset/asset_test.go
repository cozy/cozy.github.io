package asset

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"strings"
	"testing"

	"github.com/cozy/cozy-apps-registry/config"
	"github.com/ncw/swift"
	"github.com/ncw/swift/swifttest"

	_ "github.com/go-kivik/couchdb" // The CouchDB driver
	"github.com/go-kivik/kivik"
	"github.com/spf13/viper"
	"github.com/stretchr/testify/assert"
)

var store *GlobalAssetStore
var shasum []byte

func TestAddAsset(t *testing.T) {
	content := "foobar content"

	sha256 := sha256.New()
	_, err := sha256.Write([]byte(content))
	assert.NoError(t, err)
	shasum = sha256.Sum(nil)

	asset := &GlobalAsset{
		Name:        "icon",
		Shasum:      hex.EncodeToString(shasum),
		AppSlug:     "app1",
		ContentType: "image/jpeg",
	}

	err = store.AddAsset(asset, strings.NewReader(content), "app1")
	assert.NoError(t, err)

	// Check CouchDB
	row := store.DB.Get(ctx, hex.EncodeToString(shasum))
	err = row.ScanDoc(asset)
	assert.NoError(t, err)
	assert.Equal(t, len(asset.UsedBy), 1)

	// Check the FS
	conf := config.GetConfig()
	buf := new(bytes.Buffer)

	hdrs, err := conf.SwiftConnection.ObjectGet(AssetContainerName, hex.EncodeToString(shasum), buf, false, nil)
	assert.NoError(t, err)
	assert.Equal(t, "foobar content", buf.String())
	assert.Equal(t, "image/jpeg", hdrs["Content-Type"])
}

func TestGetAsset(t *testing.T) {
	buf, hdrs, err := store.FS.GetAsset(hex.EncodeToString(shasum))
	assert.NoError(t, err)
	assert.Equal(t, "image/jpeg", hdrs["Content-Type"])
	assert.Equal(t, "foobar content", buf.String())
}

func TestAddAssetAlreadyExists(t *testing.T) {
	content := "foobar content"
	asset := &GlobalAsset{
		Name:        "icon",
		Shasum:      hex.EncodeToString(shasum),
		AppSlug:     "app1",
		ContentType: "image/jpeg",
	}

	err := store.AddAsset(asset, strings.NewReader(content), "app2")
	assert.NoError(t, err)

	// Check CouchDB
	row := store.DB.Get(ctx, hex.EncodeToString(shasum))
	err = row.ScanDoc(asset)
	assert.NoError(t, err)
	assert.Equal(t, len(asset.UsedBy), 2)
}

func TestAddAssetSameApp(t *testing.T) {
	content := "foobar content"
	asset := &GlobalAsset{
		Name:        "icon",
		Shasum:      hex.EncodeToString(shasum),
		AppSlug:     "app1",
		ContentType: "image/jpeg",
	}

	err := store.AddAsset(asset, strings.NewReader(content), "app1")
	assert.NoError(t, err)

	// Check CouchDB
	row := store.DB.Get(ctx, hex.EncodeToString(shasum))
	err = row.ScanDoc(asset)
	assert.NoError(t, err)
	assert.Equal(t, len(asset.UsedBy), 2)
}

func TestRemoveAssetRemainingOthers(t *testing.T) {
	err := store.RemoveAsset(hex.EncodeToString(shasum), "app2")
	assert.NoError(t, err)

	var asset = &GlobalAsset{}
	row := store.DB.Get(ctx, hex.EncodeToString(shasum))
	err = row.ScanDoc(asset)
	assert.NoError(t, err)

	// Assert asset in FS
	var buf = new(bytes.Buffer)
	conf := config.GetConfig()
	_, err = conf.SwiftConnection.ObjectGet(AssetContainerName, hex.EncodeToString(shasum), buf, false, nil)
	assert.NoError(t, err)
	assert.NotEmpty(t, buf)
}

func TestRemoveAsset(t *testing.T) {
	err := store.RemoveAsset(hex.EncodeToString(shasum), "app1")
	assert.NoError(t, err)

	var asset *GlobalAsset
	row := store.DB.Get(ctx, hex.EncodeToString(shasum))
	err = row.ScanDoc(asset)
	assert.Error(t, err)
	assert.Equal(t, kivik.StatusNotFound, kivik.StatusCode(err))

	var buf = new(bytes.Buffer)
	conf := config.GetConfig()
	_, err = conf.SwiftConnection.ObjectGet(AssetContainerName, hex.EncodeToString(shasum), buf, false, nil)
	assert.Error(t, err)
	assert.Equal(t, swift.ObjectNotFound, err)
}

func TestMarshalAssetKey(t *testing.T) {
	assert.Equal(t, "foo/1.0.0", MarshalAssetKey("__default__", "foo", "1.0.0"))
	assert.Equal(t, "myspace/foo/2.0.0", MarshalAssetKey("myspace", "foo", "2.0.0"))
}

func TestMain(m *testing.M) {
	viper.SetDefault("couchdb.url", "http://localhost:5984")

	configFile, ok := config.FindConfigFile("cozy-registry-test")
	if ok {
		viper.SetConfigFile(configFile)
		err := viper.ReadInConfig()
		if err != nil {
			fmt.Println("Error while parsing viper config:", err)
		}
	}
	url := viper.GetString("couchdb.url")
	user := viper.GetString("couchdb.user")
	pass := viper.GetString("couchdb.password")
	prefix := viper.GetString("couchdb.prefix")

	// Mocking a Swift in memory for asset store FS
	swiftSrv, err := swifttest.NewSwiftServer("localhost")
	if err != nil {
		fmt.Printf("failed to create swift server %s", err)
	}

	viper.Set("swift.username", "swifttest")
	viper.Set("swift.api_key", "swifttest")
	viper.Set("swift.auth_url", swiftSrv.AuthURL)

	err = config.Init()
	if err != nil {
		fmt.Println("Error while initializing config", err)
	}
	store, err = InitGlobalAssetStore(url, user, pass, prefix)
	if err != nil {
		fmt.Println("Error while initializing global asset store", err)
	}

	os.Exit(m.Run())
}
