package storage

import (
	"fmt"
	"path"
	"path/filepath"

	"github.com/cozy/cozy-apps-registry/base"
)

// checkName refuses a name that does not designate a file inside its
// container: an absolute name, a name going up with "..", or the container
// itself. The local file system and S3 resolve such a name to another place,
// so a name built from a request or from an archive could reach the files of
// another container. Every implementation does the check, to behave the same.
func checkName(name string) error {
	if !filepath.IsLocal(filepath.FromSlash(name)) || path.Clean(name) == "." {
		return base.NewFileNotFoundError(fmt.Errorf("invalid file name %q", name))
	}
	return nil
}
