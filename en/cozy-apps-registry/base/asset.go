package base

import (
	"bytes"
	"io"

	"github.com/go-kivik/kivik/v3"
)

// Asset is a file persisted in the storage, with metadata in CouchDB. It can
// be used for icons, screenshorts, etc.
type Asset struct {
	ID          string   `json:"_id,omitempty"`
	Rev         string   `json:"_rev,omitempty"`
	Name        string   `json:"name"`
	Shasum      string   `json:"shasum"`
	AppSlug     string   `json:"appslug,omitempty"`
	ContentType string   `json:"content_type"`
	UsedBy      []string `json:"used_by"`
}

// AssetStore is an interface for a store to persist assets. Their content goes
// to the storage, their metadata to CouchDB, and the store maintains the
// consistency between both. The store also deduplicates assets with the same
// content.
type AssetStore interface {
	// Prepare makes sure that CouchDB and swift spaces are ready to save
	// assets.
	Prepare() error
	// Add can be used to add an asset to the store.
	Add(asset *Asset, content io.Reader, source string) error
	// Get returns the asset content and the headers.
	Get(shasum string) (*bytes.Buffer, map[string]string, error)
	// Remove can be used to remove an asset from the store.
	Remove(shasum string, source string) error
	// GetDB returns the kivik.DB objects for low-level operations.
	GetDB() *kivik.DB
}
