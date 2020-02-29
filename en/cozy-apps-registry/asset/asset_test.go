package asset

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"testing"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/config"
	_ "github.com/go-kivik/couchdb/v3" // The CouchDB driver
	"github.com/go-kivik/kivik/v3"
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

	// Check the storage
	buf, hdrs, err := base.Storage.Get(AssetContainerName, hex.EncodeToString(shasum))
	assert.NoError(t, err)
	assert.Equal(t, "foobar content", buf.String())
	assert.Equal(t, "image/jpeg", hdrs["Content-Type"])
}

func TestGetAsset(t *testing.T) {
	buf, hdrs, err := base.Storage.Get(AssetContainerName, hex.EncodeToString(shasum))
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
	buf, _, err := base.Storage.Get(AssetContainerName, hex.EncodeToString(shasum))
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
	assert.Equal(t, http.StatusNotFound, kivik.StatusCode(err))

	_, _, err = base.Storage.Get(AssetContainerName, hex.EncodeToString(shasum))
	assert.Error(t, err)
	assert.True(t, errors.Is(err, base.ErrFileNotFound))
}

func TestMarshalAssetKey(t *testing.T) {
	assert.Equal(t, "foo/1.0.0", MarshalAssetKey("__default__", "foo", "1.0.0"))
	assert.Equal(t, "myspace/foo/2.0.0", MarshalAssetKey("myspace", "foo", "2.0.0"))
}

func TestMain(m *testing.M) {
	config.SetDefaults()
	if err := config.ReadFile("", "cozy-registry-test"); err != nil {
		fmt.Println("Cannot load test config:", err)
	}

	// TODO remove those lines
	viper.Set("swift.username", "swifttest")
	viper.Set("swift.api_key", "swifttest")
	viper.Set("swift.auth_url", "localhost:12345")

	if err := config.SetupForTests(); err != nil {
		fmt.Println("Cannot configure the services:", err)
		os.Exit(1)
	}

	// TODO initialize the global asset store in config
	url := viper.GetString("couchdb.url")
	user := viper.GetString("couchdb.user")
	pass := viper.GetString("couchdb.password")

	var err error
	store, err = InitGlobalAssetStore(url, user, pass)
	if err != nil {
		fmt.Println("Error while initializing global asset store", err)
	}

	if err := config.PrepareSpaces(); err != nil {
		fmt.Println("Cannot prepare the spaces:", err)
		os.Exit(1)
	}

	os.Exit(m.Run())
}
