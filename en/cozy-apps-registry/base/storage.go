package base

import (
	"bytes"
	"io"
)

// Prefix is a way to regroup apps. It can be related to a space, but there is
// also a prefix for the global assets. And it is __default__, not the empty
// string for the default space.
type Prefix string

// String returns the prefix as a string.
func (p Prefix) String() string {
	return string(p)
}

// DefaultSpacePrefix is the prefix used for the default space.
const DefaultSpacePrefix string = "__default__"

// VirtualStorage is an interface with the operations that can be done on the
// storage.
type VirtualStorage interface {
	// Status check if the storage is up, and returns an error if it is not.
	Status() error
	// EnsureExists makes sure that the Swift container or local directory
	// exists.
	EnsureExists(prefix Prefix) error
	// EnsureEmpty makes sure that the Swift container or local directory
	// exists and does not contain any files.
	EnsureEmpty(prefix Prefix) error
	// EnsureDeleted makes sure that the Swift container or local directory
	// does no longer exist.
	EnsureDeleted(prefix Prefix) error
	// Create adds a file to the given container/directory.
	Create(prefix Prefix, name, contentType string, content io.Reader) error
	// Get fetches a file from the given container/directory.
	Get(prefix Prefix, name string) (*bytes.Buffer, map[string]string, error)
	// Remove deletes a file from the given container/directory.
	Remove(prefix Prefix, name string) error
	// Walk is a function to iterate on all object names of a given
	// container/directory.
	Walk(prefix Prefix, fn WalkFn) error
	// FindByPrefix returns a list of object names that starts with the given
	// string.
	FindByPrefix(prefix Prefix, namePrefix string) ([]string, error)
}

// WalkFn is a function defined by the caller to iterate through all object
// names with Walk.
type WalkFn func(name, contentType string) error
