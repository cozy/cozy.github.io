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
const DefaultSpacePrefix Prefix = "__default__"

// VirtualStorage is an interface with the operations that can be done on the
// storage.
type VirtualStorage interface {
	// Status check if the storage is up, and returns an error if it is not.
	Status() error
	// EnsureExists makes sure that the container holding the files exists: a
	// Swift container, or a local directory. On S3 there is nothing to create,
	// as a single bucket holds every container as a key prefix, so this does
	// nothing and Create accepts a container that was never declared.
	EnsureExists(prefix Prefix) error
	// EnsureEmpty makes sure that the container exists and does not contain
	// any file.
	EnsureEmpty(prefix Prefix) error
	// EnsureDeleted makes sure that the container no longer exists. On S3,
	// where the container is only a key prefix, this is the same as
	// EnsureEmpty.
	EnsureDeleted(prefix Prefix) error
	// Create adds a file to the given container/directory.
	Create(prefix Prefix, name, contentType string, content io.Reader) error
	// Get fetches a file from the given container/directory.
	Get(prefix Prefix, name string) (*bytes.Buffer, map[string]string, error)
	// Remove deletes a file from the given container/directory.
	Remove(prefix Prefix, name string) error
	// Walk is a function to iterate on all object names of a given
	// container/directory. The content type it reports is best-effort and can
	// be empty: on S3, listing objects cannot return it. Callers that need it
	// for sure must take it from Get.
	Walk(prefix Prefix, fn WalkFn) error
	// FindByPrefix returns a list of object names that starts with the given
	// string.
	FindByPrefix(prefix Prefix, namePrefix string) ([]string, error)
}

// WalkFn is a function defined by the caller to iterate through all object
// names with Walk.
type WalkFn func(name, contentType string) error
