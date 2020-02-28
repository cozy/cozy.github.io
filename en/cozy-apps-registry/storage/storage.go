// Package storage can be used to persist files in a storage. It is Open-Stack
// Swift in production, but having a Swift server in local for development can
// be difficult, so this package can also used a local file system for the
// storage.
package storage

import (
	"github.com/cozy/cozy-apps-registry/base"
	"github.com/ncw/swift"
)

// New returns a storage operator.
func New(conn *swift.Connection) base.VirtualStorage {
	return &swiftFS{conn: conn}
}
