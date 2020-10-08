package config

import (
	"errors"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/spf13/viper"
)

// IsVirtualSpace returns true if the given space name matches a virtual space.
func IsVirtualSpace(spaceName string) bool {
	for _, vkey := range getVspaceKeys(viper.GetStringMap("virtual_spaces")) {
		if spaceName == vkey {
			return true
		}
	}
	return false
}

// checkSpaceVspaceOverlap checks if a space and a vspace holds the same name
func checkSpaceVspaceOverlap(spaces []string, vspaces map[string]interface{}) (bool, string) {
	// Retreiving vspaces keys
	vspaceKeys := getVspaceKeys(vspaces)
	for _, vspace := range vspaceKeys {
		for _, space := range spaces {
			if vspace == space {
				return true, vspace
			}
		}
	}
	return false, ""
}

func getVspaceKeys(vspaces map[string]interface{}) []string {
	vspaceKeys := make([]string, 0, len(vspaces))
	for k := range vspaces {
		vspaceKeys = append(vspaceKeys, k)
	}
	return vspaceKeys
}

func getVirtualSpaces() (map[string]base.VirtualSpace, error) {
	virtuals := make(map[string]base.VirtualSpace)
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
		if !ok {
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
		virtuals[name] = base.VirtualSpace{
			Name:   name,
			Source: source,
			Filter: filter,
			Slugs:  slugs,
		}
	}
	return virtuals, nil
}
