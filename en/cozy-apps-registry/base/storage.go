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
	// EnsureExists make sure that the Swift container or local directory
	// exists.
	EnsureExists(prefix Prefix) error
	// EnsureEmpty make sure that the Swift container or local directory
	// exists and does not contain any files.
	EnsureEmpty(prefix Prefix) error
	// Create adds a file to the given container/directory.
	Create(prefix Prefix, name, contentType string, content io.Reader) error
	// Get fetches a file from the given container/directory.
	Get(prefix Prefix, name string) (*bytes.Buffer, map[string]string, error)
	// Remove deletes a file from the given container/directory.
	Remove(prefix Prefix, name string) error
}
