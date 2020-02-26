package asset

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path/filepath"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/config"
	"github.com/cozy/cozy-apps-registry/storage"
	"github.com/go-kivik/couchdb/v3/chttp"
	"github.com/go-kivik/kivik/v3"
)

type GlobalAsset struct {
	ID          string   `json:"_id,omitempty"`
	Rev         string   `json:"_rev,omitempty"`
	Name        string   `json:"name"`
	Shasum      string   `json:"shasum"`
	AppSlug     string   `json:"appslug,omitempty"`
	ContentType string   `json:"content_type"`
	UsedBy      []string `json:"used_by"`
}

var client *kivik.Client
var ctx = context.Background()
var AssetStore *GlobalAssetStore

const assetStoreDBSuffix string = "assets"
const AssetContainerName base.Prefix = "__assets__"

type GlobalAssetStore struct {
	FS base.Storage
	DB *kivik.DB
}

// InitGlobalAssetStore initializes the global asset store database
func InitGlobalAssetStore(addr, user, pass, prefix string) (*GlobalAssetStore, error) {
	globalAssetDB, err := InitCouchDB(addr, user, pass, prefix)
	if err != nil {
		return nil, err
	}
	fs, err := InitStorage()
	if err != nil {
		return nil, err
	}
	AssetStore = &GlobalAssetStore{
		DB: globalAssetDB,
		FS: fs,
	}
	return AssetStore, nil
}

// MarshalAssetKey returns the string key store in UsedBy field for app versions
func MarshalAssetKey(spacePrefix, appSlug, version string) string {
	if spacePrefix == config.DefaultSpacePrefix {
		spacePrefix = ""
	}
	return filepath.Join(spacePrefix, appSlug, version)
}

func InitCouchDB(addr, user, pass, prefix string) (*kivik.DB, error) {
	u, err := url.Parse(addr)
	if err != nil {
		return nil, err
	}
	u.User = nil

	client, err = kivik.New("couch", u.String())
	if err != nil {
		return nil, err
	}

	if user != "" {
		err = client.Authenticate(ctx, &chttp.BasicAuth{
			Username: user,
			Password: pass,
		})
		if err != nil {
			return nil, err
		}
	}

	assetsStoreDBName := "registry-" + assetStoreDBSuffix
	exists, err := client.DBExists(ctx, assetsStoreDBName)
	if err != nil {
		return nil, err
	}
	if !exists {
		fmt.Printf("Creating database %q...", assetsStoreDBName)
		if err := client.CreateDB(ctx, assetsStoreDBName); err != nil {
			return nil, err
		}
		fmt.Println("ok.")
	}

	globalAssetStoreDB := client.DB(ctx, assetsStoreDBName)
	if err = globalAssetStoreDB.Err(); err != nil {
		return nil, err
	}

	return globalAssetStoreDB, nil
}

func InitStorage() (base.Storage, error) {
	fs := storage.New()
	if err := fs.EnsureExists(AssetContainerName); err != nil {
		return nil, err
	}
	return fs, nil
}

func (a *GlobalAssetStore) AddAsset(asset *GlobalAsset, content io.Reader, source string) error {
	// Handles the CouchDB updates
	var doc *GlobalAsset
	row := AssetStore.DB.Get(ctx, asset.Shasum, nil)
	err := row.ScanDoc(&doc)
	if err != nil && kivik.StatusCode(err) != http.StatusNotFound {
		return err
	}

	// If asset does not exist in CouchDB global asset database, initializes it
	if kivik.StatusCode(err) == http.StatusNotFound {
		doc = asset
		doc.ID = asset.Shasum

		// Creating the asset in the FS
		err := a.FS.Create(AssetContainerName, asset.Shasum, asset.ContentType, content)
		if err != nil {
			return err
		}
	}

	// Updating the UsedBy field to add the new app version
	found := false
	for _, usedBy := range doc.UsedBy {
		if usedBy == source {
			found = true
			break
		}
	}
	if !found {
		doc.UsedBy = append(doc.UsedBy, source)
	}
	if doc.Rev == "" {
		_, _, err = AssetStore.DB.CreateDoc(ctx, doc)
	} else {
		_, err = AssetStore.DB.Put(ctx, doc.ID, doc, nil)
	}

	return err
}

func (a *GlobalAssetStore) RemoveAsset(shasum, source string) error {
	row := AssetStore.DB.Get(ctx, shasum)

	var assetDoc *GlobalAsset
	err := row.ScanDoc(&assetDoc)
	if err != nil {
		return err
	}

	updatedVersions := assetDoc.UsedBy[:0]
	for _, versionfp := range assetDoc.UsedBy {
		if versionfp == source {
			continue
		}
		updatedVersions = append(updatedVersions, versionfp)
	}

	// If there still are app versions using the asset, just update the UsedBy
	// field and return
	if len(updatedVersions) > 0 {
		assetDoc.UsedBy = updatedVersions
		_, err := AssetStore.DB.Put(ctx, shasum, assetDoc)
		return err
	}

	// First, removing from CouchDB
	_, err = AssetStore.DB.Delete(ctx, shasum, assetDoc.Rev)
	if err != nil {
		return err
	}

	// Then, removing the asset from the FS
	return AssetStore.FS.Remove(AssetContainerName, shasum)
}
