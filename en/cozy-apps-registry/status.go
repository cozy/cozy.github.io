// Package status is here just to say that the API is up and that it can
// access CouchDB, Swift and Redis for debugging and monitoring purposes.

package main

import (
	"net/http"
	"net/url"

	"github.com/cozy/cozy-apps-registry/config"
	"github.com/go-kivik/couchdb/chttp"
	"github.com/go-kivik/kivik"
	"github.com/go-redis/redis/v7"
	"github.com/labstack/echo/v4"
	"github.com/spf13/viper"
)

var redisCacheVersionsLatest redis.UniversalClient

type Entry struct {
	Status string `json:"status"`
	Reason string `json:"reason,omitempty"`
}

// Status responds with the status of the service
func Status(c echo.Context) error {
	var global string
	check := map[string]interface{}{}
	global = "ok"

	// Swift
	conf := config.GetConfig()
	sc := conf.SwiftConnection

	swift := Entry{Status: "ok"}
	if _, err := sc.QueryInfo(); err != nil {
		swift.Status = "failed"
		swift.Reason = err.Error()
		global = "failed"
	}
	check["swift"] = swift

	// CouchDB
	couchDB := Entry{Status: "ok"}
	url := viper.GetString("couchdb.url")
	user := viper.GetString("couchdb.user")
	password := viper.GetString("couchdb.password")

	ok, err := checkCouch(url, user, password)
	if !ok {
		couchDB.Status = "failed"
		couchDB.Reason = err.Error()
		global = "failed"
	}
	check["couchDB"] = couchDB

	// Redis
	r := Entry{Status: "ok"}
	optsLatest := &redis.UniversalOptions{
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
	if redisCacheVersionsLatest == nil {
		redisCacheVersionsLatest = redis.NewUniversalClient(optsLatest)
	}
	res := redisCacheVersionsLatest.Ping()
	if res.Err() != nil {
		r.Status = "failed"
		r.Reason = res.Err().Error()
		global = "failed"
	}
	check["redis"] = r

	check["status"] = global
	return c.JSON(http.StatusOK, check)
}

func checkCouch(addr, user, password string) (bool, error) {
	u, err := url.Parse(addr)
	if err != nil {
		return false, err
	}
	u.User = nil

	client, err := kivik.New("couch", u.String())
	if err != nil {
		return false, err
	}

	if user != "" {
		err = client.Authenticate(ctx, &chttp.BasicAuth{
			Username: user,
			Password: password,
		})
		if err != nil {
			return false, err
		}
	}

	ok, err := client.Ping(ctx)
	if err != nil {
		return false, err
	}

	return ok, nil
}

// Routes sets the routing for the status service
func StatusRoutes(router *echo.Group) {
	router.GET("", Status)
	router.HEAD("", Status)
}
