package config

import (
	"errors"
	"fmt"

	"github.com/cozy/swift"
	"github.com/spf13/viper"
)

var config *Config

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

type Config struct {
	SwiftConnection *swift.Connection
	// Specifies if the app cleaning task is enabled or not
	CleanEnabled bool
	// Specifies how many major versions should be kept for app cleaning tasks
	CleanNbMajorVersions int
	// For each major version, specifies how many minor versions should be kept for app cleaning tasks
	CleanNbMinorVersions int
	// Specifies how many months to look up for app versions cleaning tasks
	CleanNbMonths int
	// List of virtual spaces: name -> virtual space
	VirtualSpaces map[string]VirtualSpace
}

func New() (*Config, error) {
	viper.SetDefault("conservation.enable_background_cleaning", false)
	viper.SetDefault("conservation.major", 2)
	viper.SetDefault("conservation.minor", 2)
	viper.SetDefault("conservation.month", 2)
	sc, err := initSwiftConnection()
	if err != nil {
		return nil, fmt.Errorf("Cannot access to swift: %s", err)
	}
	virtuals, err := getVirtualSpaces()
	if err != nil {
		return nil, err
	}
	return &Config{
		SwiftConnection:      sc,
		CleanEnabled:         viper.GetBool("conservation.enable_background_cleaning"),
		CleanNbMajorVersions: viper.GetInt("conservation.major"),
		CleanNbMinorVersions: viper.GetInt("conservation.minor"),
		CleanNbMonths:        viper.GetInt("conservation.month"),
		VirtualSpaces:        virtuals,
	}, nil
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

func GetConfig() *Config {
	return config
}

func Init() error {
	var err error
	config, err = New()
	if err != nil {
		return err
	}
	return nil
}

func initSwiftConnection() (*swift.Connection, error) {
	endpointType := viper.GetString("swift.endpoint_type")

	// Create the swift connection
	swiftConnection := swift.Connection{
		UserName:     viper.GetString("swift.username"),
		ApiKey:       viper.GetString("swift.api_key"), // Password
		AuthUrl:      viper.GetString("swift.auth_url"),
		EndpointType: swift.EndpointType(endpointType),
		Tenant:       viper.GetString("swift.tenant"), // Projet name

		Domain: viper.GetString("swift.domain"),
	}

	// Authenticate to swift
	if err := swiftConnection.Authenticate(); err != nil {
		return nil, err
	}

	// Prepare containers
	spacesNames := viper.GetStringSlice("spaces")
	for _, space := range spacesNames {
		if _, _, err := swiftConnection.Container(space); err != nil {
			err = swiftConnection.ContainerCreate(space, nil)
			if err != nil {
				return nil, err
			}
		}
	}
	return &swiftConnection, nil
}
