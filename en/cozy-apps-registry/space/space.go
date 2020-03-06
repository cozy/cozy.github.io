package space

import (
	"context"
	"fmt"
	"regexp"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/go-kivik/kivik/v3"
	"github.com/labstack/echo/v4"
)

const (
	appsDBSuffix        = "apps"
	versDBSuffix        = "versions"
	pendingVersDBSuffix = "pending"
)

var validSpaceReg = regexp.MustCompile(`^[a-z]+[a-z0-9\_\-]*$`)

// AppsIndexes is the list of the mango indexes that can be used.
var AppsIndexes = map[string][]string{
	"slug":        {"slug", "editor", "type"},
	"type":        {"type", "slug", "editor"},
	"editor":      {"editor", "slug", "type"},
	"created_at":  {"created_at", "slug", "editor", "type"},
	"maintenance": {"maintenance_activated"},
}

// AppIndexName returns the long name of the index.
func AppIndexName(name string) string {
	return "apps-index-by-" + name + "-v2"
}

// Space is a way to regroup applications that are available to the same cozy
// instances. For example, it can make sense to have a space for the
// self-hosted users, with dedicated apps and konnectors.
type Space struct {
	Name          string
	dbApps        *kivik.DB
	dbVers        *kivik.DB
	dbPendingVers *kivik.DB
}

// NewSpace returns a space with the given name.
func NewSpace(name string) *Space {
	return &Space{Name: name}
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

	for name, fields := range AppsIndexes {
		idx := AppIndexName(name)
		err = s.AppsDB().CreateIndex(context.Background(), idx, idx, echo.Map{"fields": fields})
		if err != nil {
			err = fmt.Errorf("Error while creating index %q: %w", idx, err)
			return
		}
	}

	return CreateVersionsDateView(s.VersDB())
}

// Clone takes an optionnal name parameter.
// If empty, use the original space name.
func (s *Space) Clone(name string) Space {
	if name == "" {
		name = s.Name
	}
	return Space{
		Name:          name,
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
	if s.Name != "" {
		name = s.Name + "-" + name
	}
	return base.DBName(name)
}

// Spaces is a global map of name -> space.
var Spaces map[string]*Space

// Register adds a space to the Spaces map, and initializes it.
func Register(name string) error {
	if name != "" && !validSpaceReg.MatchString(name) {
		return fmt.Errorf("Space named %q contains invalid characters", name)
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
	if s.Name == "" {
		return base.DefaultSpacePrefix
	}
	return base.Prefix(s.Name)
}
