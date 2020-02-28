package config

import (
	"errors"

	"github.com/spf13/viper"
)

// VirtualSpace is a view on another space, with a filter to restrict the list
// of available applications.
type VirtualSpace struct {
	// Source is the name of a space
	Source string
	// Filter can be select (whitelist) or reject (blacklist)
	Filter string
	// Slugs is a list of webapp/connector slugs to filter
	Slugs []string
}

func inList(target string, slugs []string) bool {
	for _, slug := range slugs {
		if slug == target {
			return true
		}
	}
	return false
}

func (v *VirtualSpace) AcceptApp(slug string) bool {
	filtered := inList(slug, v.Slugs)
	if v.Filter == "select" {
		return filtered
	}
	return !filtered
}

func getVirtualSpaces() (map[string]VirtualSpace, error) {
	virtuals := make(map[string]VirtualSpace)
	for name, value := range viper.GetStringMap("virtual_spaces") {
		virtual, ok := value.(map[string]interface{})
		if !ok {
			return nil, errors.New("Invalid virtual space configuration")
		}
		source, ok := virtual["source"].(string)
		if !ok || source == "" {
			return nil, errors.New("Invalid source for a virtual space")
		}
		filter, ok := virtual["filter"].(string)
		if !ok || (filter != "select" && filter != "reject") {
			return nil, errors.New("Invalid filter for a virtual space")
		}
		list, ok := virtual["slugs"].([]interface{})
		if !ok || len(list) == 0 {
			return nil, errors.New("Invalid slugs for a virtual space")
		}
		slugs := make([]string, len(list))
		for i, slug := range list {
			s, ok := slug.(string)
			if !ok || s == "" {
				return nil, errors.New("Invalid slug for a virtual space")
			}
			slugs[i] = s
		}
		virtuals[name] = VirtualSpace{
			Source: source,
			Filter: filter,
			Slugs:  slugs,
		}
	}
	return virtuals, nil
}
