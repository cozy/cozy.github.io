package base

import (
	"context"

	"github.com/go-kivik/kivik/v3"
)

// VirtualSpace is a view on another space, with a filter to restrict the list
// of available applications.
type VirtualSpace struct {
	// Name of the virtual space
	Name string
	// Source is the name of a space
	Source string
	// Filter can be select (whitelist) or reject (blacklist)
	Filter string
	// Slugs is a list of webapp/connector slugs to filter
	Slugs []string
}

// ConfigParameters is a list of parameters that can be configured.
type ConfigParameters struct {
	// CleanEnabled specifies if the app cleaning task is enabled or not.
	CleanEnabled bool
	// CleanParameters is the parameters list for the cleaning task.
	CleanParameters CleanParameters

	// VirtualSpaces is the list of virtual spaces: name -> virtual space.
	VirtualSpaces map[string]VirtualSpace

	// DomainSpaces links a domain host to a space (for universal links).
	DomainSpaces map[string]string
	// TrustedDomains is used by the universal link to allow redirections on
	// trusted domains.
	TrustedDomains map[string][]string
	// TrustedProtocols is used by the universal link to allow redirections on
	// trusted protocols (like cozy://).
	TrustedProtocols map[string][]string
	// TrustedUrls is used by the universal link to allow redirections on
	// exact URL matches.
	TrustedUrls map[string][]string
}

// CleanParameters regroups the parameters for cleaning the old versions.
type CleanParameters struct {
	// NbMajor specifies how many major versions should be kept for app
	// cleaning tasks.
	NbMajor int
	// NbMinor specifies for each major version how many minor versions should
	// be kept for app cleaning tasks.
	NbMinor int
	// NbMonths specifies how many months to look up for app versions cleaning
	// tasks.
	NbMonths int
}

// AcceptApp returns if the configuration says that the app can be seen in this
// virtual space.
func (v VirtualSpace) AcceptApp(slug string) bool {
	filtered := inList(slug, v.Slugs)
	if v.Filter == "select" {
		return filtered
	}
	return !filtered
}

func (v VirtualSpace) Init() error {
	db := VirtualVersionsDBName(v.Name)
	ok, err := DBClient.DBExists(context.Background(), db)
	if err != nil {
		return err
	}
	if ok {
		return nil
	}
	return DBClient.CreateDB(context.Background(), db)
}

func (v VirtualSpace) VersionDB() *kivik.DB {
	name := VirtualVersionsDBName(v.Name)
	return DBClient.DB(context.Background(), name)
}

func (v VirtualSpace) OverrideDb() *kivik.DB {
	name := VirtualDBName(v.Name)
	return DBClient.DB(context.Background(), name)
}

func inList(target string, slugs []string) bool {
	for _, slug := range slugs {
		if slug == target {
			return true
		}
	}
	return false
}
