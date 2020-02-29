package base

// DatabaseNamespace is a prefix used for naming the CouchDB databases.
var DatabaseNamespace = "registry"

// DBName returns the name of the database with the namespace added as a prefix.
func DBName(name string) string {
	return DatabaseNamespace + "-" + name
}
