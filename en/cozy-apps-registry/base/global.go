// Package base is where we can define some interfaces and global variables to
// access services like cache and storage.
//
// In theory, I would have preferred to avoid global variables. But the code
// base already exists and I don't want to take too much time to refactor it.
// Using interfaces and global variables is a good compromise to my eyes. It
// allows to easily test each service in its own package and to use an
// in-memory service for other tests.
package base

import "github.com/go-kivik/kivik/v3"

// SessionSecret is the secret used to check the tokens.
var SessionSecret []byte

// LatestVersionsCache is used for caching the latest version of an app.
var LatestVersionsCache Cache

// ListVersionsCache is used for caching the list of apps in a space.
var ListVersionsCache Cache

// GlobalAssetStore is used for persisting assets like icons and screenshots.
var GlobalAssetStore AssetStore

// DBClient is the kivik client to use to make requests to CouchDB.
var DBClient *kivik.Client

// Storage is the global variable that can be used to perform operations on
// files.
var Storage VirtualStorage
