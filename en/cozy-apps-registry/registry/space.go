package registry

import (
	"context"
	"fmt"
	"strings"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/go-kivik/kivik/v3"
	"github.com/labstack/echo/v4"
)

const (
	appsDBSuffix        = "apps"
	versDBSuffix        = "versions"
	pendingVersDBSuffix = "pending"
	editorsDBSuffix     = "editors"
)

var appsIndexes = map[string][]string{
	"slug":        {"slug", "editor", "type"},
	"type":        {"type", "slug", "editor"},
	"editor":      {"editor", "slug", "type"},
	"created_at":  {"created_at", "slug", "editor", "type"},
	"maintenance": {"maintenance_activated"},
}

// Space is a way to regroup applications that are available to the same cozy
// instances. For example, it can make sense to have a space for the
// self-hosted users, with dedicated apps and konnectors.
type Space struct {
	Prefix        string
	dbApps        *kivik.DB
	dbVers        *kivik.DB
	dbPendingVers *kivik.DB
}

// NewSpace returns a space with the given name.
func NewSpace(prefix string) *Space {
	return &Space{Prefix: prefix}
}

func (s *Space) init() (err error) {
	for _, suffix := range []string{appsDBSuffix, versDBSuffix, pendingVersDBSuffix} {
		var ok bool
		dbName := s.dbName(suffix)
		ok, err = base.DBClient.DBExists(context.Background(), dbName)
		if err != nil {
			return
		}
		if !ok {
			fmt.Printf("Creating database %q...", dbName)
			if err = base.DBClient.CreateDB(context.Background(), dbName); err != nil {
				fmt.Println("failed")
				return err
			}
			fmt.Println("ok.")
		}
		db := base.DBClient.DB(context.Background(), dbName)
		if err = db.Err(); err != nil {
			return
		}
		switch suffix {
		case appsDBSuffix:
			s.dbApps = db
		case versDBSuffix:
			s.dbVers = db
		case pendingVersDBSuffix:
			s.dbPendingVers = db
		default:
			panic("unreachable")
		}
	}

	for name, fields := range appsIndexes {
		err = s.AppsDB().CreateIndex(context.Background(), appIndexName(name), appIndexName(name), echo.Map{"fields": fields})
		if err != nil {
			err = fmt.Errorf("Error while creating index %q: %s", appIndexName(name), err)
			return
		}
	}

	return
}

func appIndexName(name string) string {
	return "apps-index-by-" + name + "-v2"
}

// Clone takes an optionnal prefix parameter
// If empty, use the original space prefix
func (s *Space) Clone(prefix string) Space {
	if prefix == "" {
		prefix = s.Prefix
	}
	return Space{
		Prefix:        prefix,
		dbApps:        s.dbApps,
		dbVers:        s.dbVers,
		dbPendingVers: s.dbPendingVers,
	}
}

// AppsDB returns the database used for storing the apps in this space.
func (s *Space) AppsDB() *kivik.DB {
	return s.dbApps
}

// VersDB returns the database used for storing the published versions in this space.
func (s *Space) VersDB() *kivik.DB {
	return s.dbVers
}

// PendingVersDB returns the database used for storing the pending versions in this space.
func (s *Space) PendingVersDB() *kivik.DB {
	return s.dbPendingVers
}

// DBs returns the three databases used by this space.
func (s *Space) DBs() []*kivik.DB {
	return []*kivik.DB{s.AppsDB(), s.VersDB(), s.PendingVersDB()}
}

func (s *Space) dbName(suffix string) string {
	name := suffix
	if s.Prefix != "" {
		name = s.Prefix + "-" + name
	}
	return base.DBName(name)
}

// RemoveSpace deletes CouchDB databases and Swift container for this space.
func RemoveSpace(s *Space) error {
	// Removing the applications versions
	var cursor int = 0
	for cursor != -1 {
		next, apps, err := GetAppsList(s, &AppsListOptions{
			Limit:                200,
			Cursor:               cursor,
			LatestVersionChannel: Stable,
			VersionsChannel:      Dev,
		})

		if err != nil {
			return err
		}
		cursor = next

		for _, app := range apps { // Iterate over 200 apps
			// Skipping app with no versions
			if !app.Versions.HasVersions {
				continue
			}

			for _, version := range app.Versions.GetAll() {
				v, err := FindVersion(s, app.Slug, version)
				if err != nil {
					continue
				}
				fmt.Printf("Removing %s/%s\n", v.Slug, v.Version)
				err = v.Delete(s)
				if err != nil {
					return err
				}
			}
		}
	}

	// Removing swift container
	prefix := s.GetPrefix()
	if err := base.Storage.EnsureDeleted(prefix); err != nil {
		return err
	}

	// Removing databases
	if err := base.DBClient.DestroyDB(context.Background(), s.PendingVersDB().Name()); err != nil {
		return err
	}

	if err := base.DBClient.DestroyDB(context.Background(), s.VersDB().Name()); err != nil {
		return err
	}

	return base.DBClient.DestroyDB(context.Background(), s.AppsDB().Name())
}

// Spaces is a global map of name -> space.
var Spaces map[string]*Space

// RegisterSpace adds a space to the Spaces map.
func RegisterSpace(name string) error {
	if Spaces == nil {
		Spaces = make(map[string]*Space)
	}
	name = strings.TrimSpace(name)
	if name == base.DefaultSpacePrefix.String() {
		name = ""
	} else {
		if !validSpaceReg.MatchString(name) {
			return fmt.Errorf("Space named %q contains invalid characters", name)
		}
	}
	if _, ok := Spaces[name]; ok {
		return fmt.Errorf("Space %q already registered", name)
	}
	c := NewSpace(name)
	Spaces[name] = c
	return c.init()
}

// InitializeSpaces can be used to initialize again the spaces (ie check that
// the databases exist, have their indexes, etc.)
func InitializeSpaces() error {
	for _, c := range Spaces {
		if err := c.init(); err != nil {
			return err
		}
	}

	return nil
}

// GetSpacesNames returns the list of the space names.
func GetSpacesNames() []string {
	names := make([]string, 0, len(Spaces))
	for name := range Spaces {
		names = append(names, name)
	}
	return names
}

// GetSpace return the space with the given name
func GetSpace(name string) (*Space, bool) {
	s, ok := Spaces[name]
	return s, ok
}

// GetPrefix returns the prefix for this space.
func (s *Space) GetPrefix() base.Prefix {
	prefix := base.Prefix(s.Prefix)
	if prefix == "" {
		prefix = base.DefaultSpacePrefix
	}
	return prefix
}
