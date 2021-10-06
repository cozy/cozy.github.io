// Package asset is used to persist icons and screenshots. Its store also
// deduplicates the file contents to avoid taking too much space in Swift for
// the same things, as icons and screenshots are often the same for many
// versions of an application.
package asset

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/cozy/cozy-apps-registry/base"
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

// NewStore returns a store with the given client.
func NewStore(client *kivik.Client) base.AssetStore {
	return &store{
		client: client,
		ctx:    context.Background(),
	}
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

func (s *store) Add(asset *base.Asset, content io.Reader, source string) error {
	// Sha256
	var buf = new(bytes.Buffer)
	h := sha256.New()
	tee := io.TeeReader(content, buf)
	if _, err := io.Copy(h, tee); err != nil {
		return err
	}
	asset.Shasum = hex.EncodeToString(h.Sum(nil))

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
		err := base.Storage.Create(AssetContainerName, asset.Shasum, asset.ContentType, buf)
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
		// Seems we have ghosts in couchdb, skip couch deletion if document not found
		if kivik.StatusCode(err) == http.StatusNotFound {
			fmt.Fprintf(os.Stderr, "Attachment %s not found in CouchDB!\n", shasum)
			// Don't delete on swift in this case.
			// Currently, attachments are served directly from storage without
			// usage of the couchdb asset entry.
			// So attachment retrieval works even on couchdb ghost.
			// Removing on swift will break all other versions using the same asset.
			return nil
		} else {
			return err
		}
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
