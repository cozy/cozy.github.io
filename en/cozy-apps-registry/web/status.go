package web

import (
	"net/http"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/labstack/echo/v4"
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
	ctx := c.Request().Context()
	ok, err := base.DBClient.Ping(ctx)
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

// StatusRoutes sets the routing for the status service.
func StatusRoutes(router *echo.Group) {
	router.GET("", Status)
	router.HEAD("", Status)
}
