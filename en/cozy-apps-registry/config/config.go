package config

import (
	"bytes"
	"fmt"
	"html/template"
	"os"
	"path/filepath"
	"strings"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/cache"
	"github.com/cozy/cozy-apps-registry/storage"
	"github.com/go-redis/redis/v7"
	"github.com/ncw/swift"
	"github.com/spf13/viper"
)

// TODO move the global config object to base
var config *Config

// Config is a list of parameters that can be configured.
type Config struct {
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

// GetConfig returns the global config object.
// TODO remove GetConfig
func GetConfig() *Config {
	return config
}

// SetDefaults configures a few default values in viper.
func SetDefaults() {
	viper.SetEnvPrefix("cozy_registry")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()
	viper.SetDefault("port", 8080)
	viper.SetDefault("host", "localhost")
	viper.SetDefault("couchdb.url", "http://localhost:5984/")
	viper.SetDefault("couchdb.prefix", "cozyregistry")
	viper.SetDefault("conservation.enable_background_cleaning", false)
	viper.SetDefault("conservation.major", 2)
	viper.SetDefault("conservation.minor", 2)
	viper.SetDefault("conservation.month", 2)
}

// ReadFile reads the config file, parses it, and loads the values in viper.
func ReadFile(file, defaultFile string) error {
	if file == "" {
		if f, ok := FindConfigFile(defaultFile); ok {
			file = f
		} else {
			return nil
		}
	}

	parser := template.New(filepath.Base(file))
	parser = parser.Option("missingkey=zero")
	tmpl, err := parser.ParseFiles(file)
	if err != nil {
		return fmt.Errorf("Failed to parse cozy-apps-registry configuration %q: %w",
			file, err)
	}

	dest := new(bytes.Buffer)
	ctxt := &struct{ Env map[string]string }{Env: envMap()}
	err = tmpl.ExecuteTemplate(dest, filepath.Base(file), ctxt)
	if err != nil {
		return fmt.Errorf("Failed to parse cozy-apps-registry configuration %q: %w",
			file, err)
	}

	if ext := filepath.Ext(file); len(ext) > 0 {
		viper.SetConfigType(ext[1:])
	}

	if err = viper.ReadConfig(dest); err != nil {
		return fmt.Errorf("Failed to read cozy-apps-registry configuration %q: %w",
			file, err)
	}

	return nil
}

func envMap() map[string]string {
	env := make(map[string]string)
	for _, i := range os.Environ() {
		sep := strings.Index(i, "=")
		env[i[0:sep]] = i[sep+1:]
	}
	return env
}

// SetupServices connects the cache, database and storage services.
func SetupServices() error {
	var err error
	config, err = New()
	if err != nil {
		return err
	}

	if err := configureCache(); err != nil {
		return fmt.Errorf("Cannot configure the cache: %w", err)
	}

	base.DatabaseNamespace = viper.GetString("couchdb.prefix")

	// TODO allow to use a local FS storage
	sc, err := initSwiftConnection()
	if err != nil {
		return fmt.Errorf("Cannot access to swift: %s", err)
	}
	base.Storage = storage.NewSwift(sc)
	return nil
}

// SetupForTests can be used to setup the services with in-memory implementations
// for tests.
func SetupForTests() error {
	var err error
	config, err = New()
	if err != nil {
		return err
	}

	base.DatabaseNamespace = "cozy-registry-test"

	configureLRUCache()

	// Use https://github.com/go-kivik/memorydb for CouchDB when it will be
	// more complete.

	base.Storage = storage.NewMemFS()
	return nil
}

// New returns a new config object with the fields filled from viper.
func New() (*Config, error) {
	virtuals, err := getVirtualSpaces()
	if err != nil {
		return nil, err
	}
	return &Config{
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

func configureCache() error {
	redisURL := viper.GetString("redis.addrs")
	if redisURL == "" {
		configureLRUCache()
		return nil
	}

	optsLatest := &redis.UniversalOptions{
		// Either a single address or a seed list of host:port addresses
		// of cluster/sentinel nodes.
		Addrs: viper.GetStringSlice("redis.addrs"),

		// The sentinel master name.
		// Only failover clients.
		MasterName: viper.GetString("redis.master"),

		// Enables read only queries on slave nodes.
		ReadOnly: viper.GetBool("redis.read_only_slave"),

		MaxRetries:         viper.GetInt("redis.max_retries"),
		Password:           viper.GetString("redis.password"),
		DialTimeout:        viper.GetDuration("redis.dial_timeout"),
		ReadTimeout:        viper.GetDuration("redis.read_timeout"),
		WriteTimeout:       viper.GetDuration("redis.write_timeout"),
		PoolSize:           viper.GetInt("redis.pool_size"),
		PoolTimeout:        viper.GetDuration("redis.pool_timeout"),
		IdleTimeout:        viper.GetDuration("redis.idle_timeout"),
		IdleCheckFrequency: viper.GetDuration("redis.idle_check_frequency"),
		DB:                 viper.GetInt("redis.databases.versionsLatest"),
	}

	optsList := &redis.UniversalOptions{
		// Either a single address or a seed list of host:port addresses
		// of cluster/sentinel nodes.
		Addrs: viper.GetStringSlice("redis.addrs"),

		// The sentinel master name.
		// Only failover clients.
		MasterName: viper.GetString("redis.master"),

		// Enables read only queries on slave nodes.
		ReadOnly: viper.GetBool("redis.read_only_slave"),

		MaxRetries:         viper.GetInt("redis.max_retries"),
		Password:           viper.GetString("redis.password"),
		DialTimeout:        viper.GetDuration("redis.dial_timeout"),
		ReadTimeout:        viper.GetDuration("redis.read_timeout"),
		WriteTimeout:       viper.GetDuration("redis.write_timeout"),
		PoolSize:           viper.GetInt("redis.pool_size"),
		PoolTimeout:        viper.GetDuration("redis.pool_timeout"),
		IdleTimeout:        viper.GetDuration("redis.idle_timeout"),
		IdleCheckFrequency: viper.GetDuration("redis.idle_check_frequency"),
		DB:                 viper.GetInt("redis.databases.versionsList"),
	}
	redisCacheVersionsLatest := redis.NewUniversalClient(optsLatest)
	redisCacheVersionsList := redis.NewUniversalClient(optsList)

	res := redisCacheVersionsLatest.Ping()
	if err := res.Err(); err != nil {
		return err
	}
	base.LatestVersionsCache = cache.NewRedisCache(base.DefaultCacheTTL, redisCacheVersionsLatest)
	base.ListVersionsCache = cache.NewRedisCache(base.DefaultCacheTTL, redisCacheVersionsList)
	return nil
}

func configureLRUCache() {
	base.LatestVersionsCache = cache.NewLRUCache(256, base.DefaultCacheTTL)
	base.ListVersionsCache = cache.NewLRUCache(256, base.DefaultCacheTTL)
}

// PrepareSpaces makes sure that the CouchDB databases and Swift containers for
// the spaces exist and have their index/views.
func PrepareSpaces() error {
	spacesNames := viper.GetStringSlice("spaces")
	for _, space := range spacesNames {
		// TODO we should have a method to convert a space name to a prefix
		if err := base.Storage.EnsureExists(base.Prefix(space)); err != nil {
			return err
		}
	}
	return nil
}
