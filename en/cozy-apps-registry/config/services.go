package config

import (
	"context"
	"fmt"
	"net/url"
	"strings"

	"github.com/cozy/cozy-apps-registry/asset"
	"github.com/cozy/cozy-apps-registry/auth"
	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/cache"
	"github.com/cozy/cozy-apps-registry/space"
	"github.com/cozy/cozy-apps-registry/storage"
	"github.com/go-kivik/couchdb/v3/chttp"
	"github.com/go-kivik/kivik/v3"
	"github.com/go-redis/redis/v7"
	"github.com/ncw/swift"
	"github.com/spf13/viper"
)

const editorsDBSuffix = "editors"

// SetupServices connects the cache, database and storage services.
func SetupServices() error {
	if err := configureParameters(); err != nil {
		return err
	}

	if err := configureCache(); err != nil {
		return fmt.Errorf("Cannot configure the cache: %w", err)
	}

	base.DatabaseNamespace = viper.GetString("couchdb.prefix")
	if err := configureCouch(false); err != nil {
		return fmt.Errorf("Cannot configure CouchDB: %w", err)
	}

	for _, c := range base.Config.VirtualSpaces {
		if err := c.Init(); err != nil {
			return err
		}
	}

	if dir := viper.GetString("fs"); dir != "" {
		base.Storage = storage.NewFS(dir)
	} else {
		sc, err := initSwiftConnection()
		if err != nil {
			return fmt.Errorf("Cannot access to swift: %s", err)
		}
		base.Storage = storage.NewSwift(sc)
	}
	return nil
}

// SetupForTests can be used to setup the services with in-memory implementations
// for tests.
func SetupForTests() error {
	if err := configureParameters(); err != nil {
		return err
	}

	base.DatabaseNamespace = "cozy-registry-test"
	if err := configureCouch(true); err != nil {
		return err
	}

	for _, c := range base.Config.VirtualSpaces {
		if err := c.Init(); err != nil {
			return err
		}
	}

	configureLRUCache()

	// Use https://github.com/go-kivik/memorydb for CouchDB when it will be
	// more complete.

	base.Storage = storage.NewMemFS()
	return nil
}

// CleanupTests can be used to clean all the CouchDB databases used for tests.
func CleanupTests() error {
	base.LatestVersionsCache = nil
	base.ListVersionsCache = nil

	ctx := context.Background()
	for name := range base.Config.VirtualSpaces {
		_ = base.DBClient.DestroyDB(ctx, base.VirtualDBName(name))
		_ = base.DBClient.DestroyDB(ctx, base.VirtualVersionsDBName(name))
	}

	for _, s := range space.Spaces {
		if err := base.DBClient.DestroyDB(ctx, s.PendingVersDB().Name()); err != nil {
			fmt.Printf("Error while cleaning database %q: %s\n", s.PendingVersDB().Name(), err)
		}

		if err := base.DBClient.DestroyDB(ctx, s.VersDB().Name()); err != nil {
			fmt.Printf("Error while cleaning database %q: %s\n", s.VersDB().Name(), err)
		}

		if err := base.DBClient.DestroyDB(ctx, s.AppsDB().Name()); err != nil {
			fmt.Printf("Error while cleaning database %q: %s\n", s.AppsDB().Name(), err)
		}
	}
	space.Spaces = make(map[string]*space.Space)

	editorsDBName := base.DBName(editorsDBSuffix)
	if err := base.DBClient.DestroyDB(ctx, editorsDBName); err != nil {
		fmt.Printf("Error while cleaning database %q: %s\n", editorsDBName, err)
	}
	auth.Editors = nil

	if db := base.GlobalAssetStore.GetDB(); db != nil {
		if err := base.DBClient.DestroyDB(ctx, db.Name()); err != nil {
			fmt.Printf("Error while cleaning database %q: %s\n", db.Name(), err)
		}
	}
	base.GlobalAssetStore = nil

	base.Storage = nil
	return nil
}

func configureParameters() error {
	virtuals, err := getVirtualSpaces()
	if err != nil {
		return err
	}
	base.Config = base.ConfigParameters{
		CleanEnabled: viper.GetBool("conservation.enable_background_cleaning"),
		CleanParameters: base.CleanParameters{
			NbMajor:  viper.GetInt("conservation.major"),
			NbMinor:  viper.GetInt("conservation.minor"),
			NbMonths: viper.GetInt("conservation.month"),
		},
		VirtualSpaces:  virtuals,
		DomainSpaces:   viper.GetStringMapString("domain_space"),
		TrustedDomains: viper.GetStringMapStringSlice("trusted_domains"),
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

func configureCouch(purge bool) error {
	client, err := newClient(
		viper.GetString("couchdb.url"),
		viper.GetString("couchdb.user"),
		viper.GetString("couchdb.password"))
	if err != nil {
		return fmt.Errorf("Could not reach CouchDB: %w", err)
	}
	base.DBClient = client

	if purge {
		// Purge all databases, test purpose
		dbs, err := base.DBClient.AllDBs(context.Background())
		if err != nil {
			return err
		}
		for _, db := range dbs {
			if strings.HasPrefix(db, base.DatabaseNamespace+"-") {
				if err := base.DBClient.DestroyDB(context.Background(), db); err != nil {
					return err
				}
			}
		}
	}

	editorsDBName := base.DBName(editorsDBSuffix)
	exists, err := client.DBExists(context.Background(), editorsDBName)
	if err != nil {
		return err
	}
	if !exists {
		fmt.Printf("Creating database %q...", editorsDBName)
		if err = client.CreateDB(context.Background(), editorsDBName); err != nil {
			return err
		}
		fmt.Println("ok.")
	}

	editorsDB := client.DB(context.Background(), editorsDBName)
	if err = editorsDB.Err(); err != nil {
		return fmt.Errorf("Could not reach CouchDB: %s", err)
	}
	vault := auth.NewCouchDBVault(editorsDB)
	auth.Editors = auth.NewEditorRegistry(vault)

	base.GlobalAssetStore = asset.NewStore(client)
	return nil
}

func newClient(addr, user, pass string) (*kivik.Client, error) {
	u, err := url.Parse(addr)
	if err != nil {
		return nil, err
	}
	u.User = nil

	client, err := kivik.New("couch", u.String())
	if err != nil {
		return nil, err
	}

	if pass != "" {
		auth := &chttp.BasicAuth{
			Username: user,
			Password: pass,
		}
		if err := client.Authenticate(context.Background(), auth); err != nil {
			return nil, err
		}
	}

	return client, nil
}

func GetSpaces() []string {
	spaceNames := viper.GetStringSlice("spaces")
	if len(spaceNames) == 0 {
		spaceNames = []string{""}
	}
	return spaceNames
}

func GetVirtualSpaces() []string {
	return getVspaceKeys(viper.GetStringMap("virtual_spaces"))
}

func GetVirtualSpace(spaceName string) (*base.VirtualSpace, error) {
	if !IsVirtualSpace(spaceName) {
		return nil, fmt.Errorf("%q is not a configured virtual space.", spaceName)
	}

	virtuals, err := getVirtualSpaces()
	if err != nil {
		return nil, err
	}

	sp := virtuals[spaceName]

	return &sp, nil
}

// PrepareSpaces makes sure that the CouchDB databases and Swift containers for
// the spaces exist and have their index/views.
func PrepareSpaces(initStorage bool) error {
	spaceNames := GetSpaces()
	space.Spaces = make(map[string]*space.Space)

	if ok, name := checkSpaceVspaceOverlap(spaceNames, viper.GetStringMap("virtual_spaces")); ok {
		return fmt.Errorf("%q is defined as a space and a virtual space (check your config file)", name)
	}

	for _, spaceName := range spaceNames {
		spaceName = strings.TrimSpace(spaceName)
		prefix := base.Prefix(spaceName)
		if prefix == base.DefaultSpacePrefix {
			spaceName = ""
		}

		// Register the space in registry spaces list and prepare CouchDB.
		if err := space.Register(spaceName); err != nil {
			return fmt.Errorf("Cannot register space %q: %w", spaceName, err)
		}

		if initStorage {
			// Prepare the storage.
			if err := base.Storage.EnsureExists(prefix); err != nil {
				return fmt.Errorf("Cannot create storage container %q: %w", prefix, err)
			}
		}
	}

	return base.GlobalAssetStore.Prepare()
}
