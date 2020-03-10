package registry

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/cozy/cozy-apps-registry/asset"
	"github.com/cozy/cozy-apps-registry/base"
	"github.com/go-kivik/kivik/v3"
)

const virtualSuffix = "overwrites"

// OverwriteAppName tells that an app will have a different name in the virtual
// space.
func OverwriteAppName(virtualSpaceName, appSlug, newName string) error {
	db, err := getDBForVirtualSpace(virtualSpaceName)
	if err != nil {
		return err
	}

	overwrite, err := findOverwrite(db, appSlug)
	if err != nil {
		return err
	}
	overwrite["name"] = newName

	id := getAppID(appSlug)
	_, err = db.Put(context.Background(), id, overwrite)
	return err
}

// OverwriteAppIcon tells that an app will have a different icon in the virtual
// space.
func OverwriteAppIcon(virtualSpaceName, appSlug, file string) error {
	icon, err := os.Open(file)
	if err != nil {
		return err
	}
	defer icon.Close()

	db, err := getDBForVirtualSpace(virtualSpaceName)
	if err != nil {
		return err
	}

	overwrite, err := findOverwrite(db, appSlug)
	if err != nil {
		return err
	}

	source := asset.ComputeSource(base.Prefix(virtualSpaceName), appSlug, "*")
	a := &base.Asset{
		Name:        filepath.Base(file),
		AppSlug:     appSlug,
		ContentType: getMIMEType(file, []byte{}),
	}
	err = base.GlobalAssetStore.Add(a, icon, source)
	if err != nil {
		return err
	}
	overwrite["icon"] = a.Shasum

	id := getAppID(appSlug)
	_, err = db.Put(context.Background(), id, overwrite)
	return err
}

// ActivateMaintenanceVirtualSpace tells that an app is in maintenance in the
// given virtual space.
func ActivateMaintenanceVirtualSpace(virtualSpaceName, appSlug string, opts MaintenanceOptions) error {
	db, err := getDBForVirtualSpace(virtualSpaceName)
	if err != nil {
		return err
	}

	overwrite, err := findOverwrite(db, appSlug)
	if err != nil {
		return err
	}
	overwrite["maintenance_activated"] = true
	overwrite["maintenance_options"] = opts

	id := getAppID(appSlug)
	_, err = db.Put(context.Background(), id, overwrite)
	return err
}

// DeactivateMaintenanceVirtualSpace tells that an app is no longer in
// maintenance in the given virtual space.
func DeactivateMaintenanceVirtualSpace(virtualSpaceName, appSlug string) error {
	db, err := getDBForVirtualSpace(virtualSpaceName)
	if err != nil {
		return err
	}

	overwrite, err := findOverwrite(db, appSlug)
	if err != nil {
		return err
	}
	overwrite["maintenance_activated"] = false
	delete(overwrite, "maintenance_options")

	id := getAppID(appSlug)
	_, err = db.Put(context.Background(), id, overwrite)
	return err
}

func getDBForVirtualSpace(virtualSpaceName string) (*kivik.DB, error) {
	dbName := base.DBName(virtualSpaceName + "-" + virtualSuffix)
	ok, err := base.DBClient.DBExists(context.Background(), dbName)
	if err != nil {
		return nil, err
	}
	if !ok {
		fmt.Printf("Creating database %q...", dbName)
		if err = base.DBClient.CreateDB(context.Background(), dbName); err != nil {
			fmt.Println("failed")
			return nil, err
		}
		fmt.Println("ok.")
	}
	db := base.DBClient.DB(context.Background(), dbName)
	if err = db.Err(); err != nil {
		return nil, err
	}
	return db, nil
}

func findOverwrite(db *kivik.DB, appSlug string) (map[string]interface{}, error) {
	if !validSlugReg.MatchString(appSlug) {
		return nil, ErrAppSlugInvalid
	}

	doc := map[string]interface{}{}
	row := db.Get(context.Background(), getAppID(appSlug))
	err := row.ScanDoc(&doc)
	if err != nil && kivik.StatusCode(err) != http.StatusNotFound {
		return nil, err
	}

	return doc, nil
}
