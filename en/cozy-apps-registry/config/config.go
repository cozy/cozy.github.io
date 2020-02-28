package config

import (
	"fmt"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/storage"
	"github.com/ncw/swift"
	"github.com/spf13/viper"
)

// TODO move this to base package
const DefaultSpacePrefix string = "__default__"

var config *Config

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
	VirtualSpaces  map[string]VirtualSpace
	DomainSpaces   map[string]string
	TrustedDomains map[string][]string
}

// TODO remove GetConfig
func GetConfig() *Config {
	return config
}

func Init() error {
	var err error
	config, err = New()
	if err != nil {
		return err
	}
	base.Storage = storage.NewSwift(config.SwiftConnection)
	return prepareContainers()
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
		DomainSpaces:         viper.GetStringMapString("domain_space"),
		TrustedDomains:       viper.GetStringMapStringSlice("trusted_domains"),
	}, nil
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
		Domain:       viper.GetString("swift.domain"),
	}

	// Authenticate to swift
	if err := swiftConnection.Authenticate(); err != nil {
		return nil, err
	}

	// Prepare containers
	return &swiftConnection, nil
}

// TestSetup can be used to setup the services with in-memory implementations
// for tests.
func TestSetup() {
	base.Storage = storage.NewMemFS()
	if err := prepareContainers(); err != nil {
		panic(err)
	}

	// Use https://github.com/go-kivik/memorydb for CouchDB when it will be
	// more complete.
}

func prepareContainers() error {
	spacesNames := viper.GetStringSlice("spaces")
	for _, space := range spacesNames {
		// TODO we should have a method to convert a space name to a prefix
		if err := base.Storage.EnsureExists(base.Prefix(space)); err != nil {
			return err
		}
	}
	return nil
}
