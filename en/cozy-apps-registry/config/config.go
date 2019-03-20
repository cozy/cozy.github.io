package config

import (
	"fmt"

	"github.com/cozy/swift"
	"github.com/spf13/viper"
)

var config *Config

type Config struct {
	SwiftConnection *swift.Connection
	// Specifies how many major versions should be kept for app cleaning tasks
	CleanNbMajorVersions int
	// For each major version, specifies how many minor versions should be kept for app cleaning tasks
	CleanNbMinorVersions int
	// Specifies how many months to look up for app versions cleaning tasks
	CleanNbMonths int
}

func New() (*Config, error) {
	viper.SetDefault("conservation.major", 2)
	viper.SetDefault("conservation.minor", 2)
	viper.SetDefault("conservation.month", 2)
	sc, err := initSwiftConnection()
	if err != nil {
		return nil, fmt.Errorf("Cannot access to swift: %s", err)
	}
	return &Config{
		SwiftConnection:      sc,
		CleanNbMajorVersions: viper.GetInt("conservation.major"),
		CleanNbMinorVersions: viper.GetInt("conservation.minor"),
		CleanNbMonths:        viper.GetInt("conservation.month"),
	}, nil
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
