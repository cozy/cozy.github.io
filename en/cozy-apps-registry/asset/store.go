// Package asset is used to persist icons and screenshots. Its store also
// deduplicates the file contents to avoid taking too much space in Swift for
// the same things, as icons and screenshots are often the same for many
// versions of an application.
package asset

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path/filepath"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/go-kivik/couchdb/v3/chttp"
	"github.com/go-kivik/kivik/v3"
)

const assetStoreDBSuffix string = "assets"

// AssetContainerName is the name on the Swift container where asset contents
// are persisted.
const AssetContainerName base.Prefix = "__assets__"

// ComputeSource returns the string key store in UsedBy field for app versions.
func ComputeSource(spacePrefix base.Prefix, appSlug, version string) string {
	space := ""
	if spacePrefix != base.DefaultSpacePrefix {
		space = spacePrefix.String()
	}
	return filepath.Join(space, appSlug, version)
}

// NewStore initializes the global asset store database
// TODO move client creation to config
func NewStore(addr, user, pass string) (base.AssetStore, error) {
	ctx := context.Background()
	u, err := url.Parse(addr)
	if err != nil {
		return nil, err
	}
	u.User = nil

	client, err := kivik.New("couch", u.String())
	if err != nil {
		return nil, err
	}

	if pass != "" {
		err = client.Authenticate(ctx, &chttp.BasicAuth{
			Username: user,
			Password: pass,
		})
		if err != nil {
			return nil, err
		}
	}

	store := &store{
		client: client,
		ctx:    context.Background(),
	}
	return store, nil
}

type store struct {
	client *kivik.Client
	db     *kivik.DB
	ctx    context.Context
}

func (s *store) Prepare() error {
	dbName := base.DBName(assetStoreDBSuffix)
	exists, err := s.client.DBExists(s.ctx, dbName)
	if err != nil {
		return err
	}
	if !exists {
		fmt.Printf("Creating database %q...", dbName)
		if err := s.client.CreateDB(s.ctx, dbName); err != nil {
			return err
		}
		fmt.Println("ok.")
	}

	db := s.client.DB(s.ctx, dbName)
	if err = db.Err(); err != nil {
		return err
	}
	s.db = db

	return base.Storage.EnsureExists(AssetContainerName)
}

// TODO move the shasum computation in Add
func (s *store) Add(asset *base.Asset, content io.Reader, source string) error {
	// Handles the CouchDB updates
	var doc *base.Asset
	row := s.db.Get(s.ctx, asset.Shasum, nil)
	err := row.ScanDoc(&doc)
	if err != nil && kivik.StatusCode(err) != http.StatusNotFound {
		return err
	}

	// If asset does not exist in CouchDB global asset database, initializes it
	if kivik.StatusCode(err) == http.StatusNotFound {
		doc = asset
		doc.ID = asset.Shasum

		// Creating the asset in the FS
		err := base.Storage.Create(AssetContainerName, asset.Shasum, asset.ContentType, content)
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
		_, _, err = s.db.CreateDoc(s.ctx, doc)
	} else {
		_, err = s.db.Put(s.ctx, doc.ID, doc, nil)
	}

	return err
}

func (s *store) Get(shasum string) (*bytes.Buffer, map[string]string, error) {
	return base.Storage.Get(AssetContainerName, shasum)
}

func (s *store) Remove(shasum, source string) error {
	var doc *base.Asset
	row := s.db.Get(s.ctx, shasum)
	if err := row.ScanDoc(&doc); err != nil {
		return err
	}

	updated := doc.UsedBy[:0]
	for _, usedBy := range doc.UsedBy {
		if usedBy != source {
			updated = append(updated, usedBy)
		}
	}
	doc.UsedBy = updated

	// If there still are app versions using the asset, just update the UsedBy
	// field and return
	if len(doc.UsedBy) > 0 {
		_, err := s.db.Put(s.ctx, shasum, doc)
		return err
	}

	// First, removing from CouchDB
	if _, err := s.db.Delete(s.ctx, shasum, doc.Rev); err != nil {
		return err
	}

	// Then, removing the asset from the FS
	return base.Storage.Remove(AssetContainerName, shasum)
}

func (s *store) GetDB() *kivik.DB {
	return s.db
}
