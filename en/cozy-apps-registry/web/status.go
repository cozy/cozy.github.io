package web

import (
	"context"
	"net/http"
	"net/url"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/go-kivik/couchdb/v3/chttp"
	"github.com/go-kivik/kivik/v3"
	"github.com/labstack/echo/v4"
	"github.com/spf13/viper"
)

type entry struct {
	Status string `json:"status"`
	Reason string `json:"reason,omitempty"`
}

// Status responds with the status of the cache, couch and storage services.
func Status(c echo.Context) error {
	var global string
	check := map[string]interface{}{}
	global = "ok"

	// Swift
	swift := entry{Status: "ok"}
	if err := base.Storage.Status(); err != nil {
		swift.Status = "failed"
		swift.Reason = err.Error()
		global = "failed"
	}
	check["swift"] = swift

	// CouchDB
	couchDB := entry{Status: "ok"}
	// TODO do not access viper from the web package
	url := viper.GetString("couchdb.url")
	user := viper.GetString("couchdb.user")
	password := viper.GetString("couchdb.password")
	ctx := c.Request().Context()

	ok, err := checkCouch(ctx, url, user, password)
	if !ok {
		couchDB.Status = "failed"
		couchDB.Reason = err.Error()
		global = "failed"
	}
	check["couchDB"] = couchDB

	// Redis
	r := entry{Status: "ok"}
	if err := base.LatestVersionsCache.Status(); err != nil {
		r.Status = "failed"
		r.Reason = err.Error()
		global = "failed"
	}
	check["redis"] = r

	check["status"] = global
	return c.JSON(http.StatusOK, check)
}

func checkCouch(ctx context.Context, addr, user, password string) (bool, error) {
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

// StatusRoutes sets the routing for the status service.
func StatusRoutes(router *echo.Group) {
	router.GET("", Status)
	router.HEAD("", Status)
}
