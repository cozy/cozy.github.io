package web

import (
	"bytes"
	"compress/gzip"
	"encoding/base64"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/cozy/cozy-apps-registry/auth"
	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/errshttp"
	"github.com/cozy/cozy-apps-registry/registry"
	"github.com/cozy/cozy-apps-registry/space"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/sirupsen/logrus"
)

const authTokenScheme = "Token "
const spaceKey = "space"

var errSpaceNotFound = base.Error{Code: 404, Wrapped: errors.New("Cannot find space")}

var (
	fiveMinute = 5 * time.Minute
	oneHour    = 1 * time.Hour
	oneYear    = 365 * 24 * time.Hour
)

// Do not show internal identifier and revision
func cleanVersion(version *registry.Version) {
	version.ID = ""
	version.Rev = ""
}

// Do not show internal identifier and revision
func cleanApp(app *registry.App) {
	app.ID = ""
	app.Rev = ""
	if app.LatestVersion != nil {
		cleanVersion(app.LatestVersion)
	}
}

func checkAuthorized(c echo.Context) error {
	token, err := extractAuthHeader(c)
	if err != nil {
		return err
	}
	if !auth.VerifyTokenAuthentication(base.SessionSecret, token) {
		return errshttp.NewError(http.StatusUnauthorized, "Token could not be verified")
	}
	return nil
}

func checkPermissions(c echo.Context, editorName string, appName string, master bool) (*auth.Editor, error) {
	token, err := extractAuthHeader(c)
	if err != nil {
		return nil, err
	}
	editor, err := auth.Editors.GetEditor(editorName)
	if err != nil {
		return nil, errshttp.NewError(http.StatusUnauthorized, "Could not find editor: %s", editorName)
	}
	ok := false
	if !master {
		ok = editor.VerifyEditorToken(base.SessionSecret, token, appName)
	}
	if !ok {
		editors, err := auth.Editors.AllEditors()
		if err != nil {
			return nil, err
		}
		for _, e := range editors {
			if ok = e.VerifyMasterToken(base.SessionSecret, token); ok {
				break
			}
		}
	}
	if !ok {
		return nil, errshttp.NewError(http.StatusUnauthorized, "Token could not be verified")
	}
	return editor, nil
}

func extractAuthHeader(c echo.Context) ([]byte, error) {
	authHeader := c.Request().Header.Get(echo.HeaderAuthorization)
	if !strings.HasPrefix(authHeader, authTokenScheme) {
		return nil, errshttp.NewError(http.StatusUnauthorized, "Missing prefix from authorization header")
	}
	tokenStr := authHeader[len(authTokenScheme):]
	if len(tokenStr) > 1024 { // tokens should be much less than 128bytes
		return nil, errshttp.NewError(http.StatusUnauthorized, "Token is too long")
	}
	token, err := base64.StdEncoding.DecodeString(tokenStr)
	if err != nil {
		return nil, errshttp.NewError(http.StatusUnauthorized, "Token is not properly base64 encoded")
	}
	return token, nil
}

func filterGetMaintenanceApps(virtual base.VirtualSpace) echo.HandlerFunc {
	return func(c echo.Context) error {
		apps, err := registry.GetMaintainanceApps(getSpace(c))
		if err != nil {
			return err
		}
		filtered := apps[:0]
		for _, app := range apps {
			if virtual.AcceptApp(app.Slug) {
				filtered = append(filtered, app)
			}
		}
		return writeJSON(c, filtered)
	}
}

// jsonEndPoint middleware checks that the Content-Type and Accept headers are
// properly set for an application/json endpoint.
func jsonEndpoint(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		c.Set("json", true)
		req := c.Request()
		switch req.Method {
		case http.MethodPost, http.MethodPut, http.MethodPatch:
			contentType := c.Request().Header.Get(echo.HeaderContentType)
			if !strings.HasPrefix(contentType, echo.MIMEApplicationJSON) {
				return errshttp.NewError(http.StatusUnsupportedMediaType,
					"Content-Type should be application/json")
			}
		}
		acceptHeader := req.Header.Get("Accept")
		if acceptHeader != "" &&
			!strings.Contains(acceptHeader, echo.MIMEApplicationJSON) &&
			!strings.Contains(acceptHeader, "*/*") {
			return errshttp.NewError(http.StatusNotAcceptable,
				"Accept header does not contain application/json")
		}
		return next(c)
	}
}

func ensureSpace(spaceName string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			space, ok := space.GetSpace(spaceName)
			if !ok {
				return echo.NewHTTPError(http.StatusNotFound, fmt.Sprintf("Space %q does not exist", spaceName))
			}
			c.Set(spaceKey, space)
			return next(c)
		}
	}
}

func getSpace(c echo.Context) *space.Space {
	return c.Get(spaceKey).(*space.Space)
}

func getSpaceFromHost(c echo.Context) (*space.Space, error) {
	host := strings.Split(c.Request().Host, ":")[0]

	if spaceName, ok := base.Config.DomainSpaces[host]; ok {
		if spaceName == base.DefaultSpacePrefix.String() {
			spaceName = ""
		}
		if space, ok := space.GetSpace(spaceName); ok {
			return space, nil
		}
	}

	return nil, errSpaceNotFound
}

func getVersionsChannel(c echo.Context, defaultChannel registry.Channel) registry.Channel {
	queryParam := c.QueryParam("versionsChannel")
	if queryParam == "" {
		return defaultChannel
	}
	channel, err := registry.StrToChannel(queryParam)
	if err != nil {
		return defaultChannel
	}
	return channel
}

func validateAppRequest(c echo.Context, app *registry.AppOptions) error {
	if err := registry.IsValidApp(app); err != nil {
		return wrapErr(err, http.StatusBadRequest)
	}
	return nil
}

func validateVersionRequest(c echo.Context, ver *registry.VersionOptions) error {
	if err := registry.IsValidVersion(ver); err != nil {
		return wrapErr(err, http.StatusBadRequest)
	}
	return nil
}

func httpErrorHandler(err error, c echo.Context) {
	code := http.StatusInternalServerError
	desc := err.Error()
	msg := desc

	isJSON, _ := c.Get("json").(bool)

	if he, ok := err.(*errshttp.Error); ok {
		code = he.StatusCode()
	} else if be, ok := err.(base.Error); ok {
		code = be.Code
		msg = be.Message()
	} else if he, ok := err.(*echo.HTTPError); ok {
		code = he.Code
		desc = fmt.Sprintf("%s", he.Message)
		msg = desc
	}

	respHeaders := c.Response().Header()
	switch err {
	case registry.ErrVersionNotFound, registry.ErrAppNotFound:
		respHeaders.Set("cache-control", "max-age=60")
	default:
		respHeaders.Set("cache-control", "no-cache")
	}

	log := logrus.WithFields(logrus.Fields{
		"nspace":      "http_error",
		"is_json":     isJSON,
		"method":      c.Request().Method,
		"request_uri": c.Request().RequestURI,
		"remote_ip":   c.Request().RemoteAddr,
		"status":      code,
		"error_msg":   msg,
	})
	if code >= 500 {
		log.Error()
	} else if code == 404 {
		log.Debug()
	} else {
		log.Info()
	}

	err = nil
	if !c.Response().Committed {
		if isJSON {
			if c.Request().Method == echo.HEAD {
				c.Response().Header().Set(echo.HeaderContentType, echo.MIMEApplicationJSONCharsetUTF8)
				err = c.NoContent(code)
			} else {
				err = c.JSON(code, echo.Map{"error": desc})
			}
		} else {
			if c.Request().Method == echo.HEAD {
				c.Response().Header().Set(echo.HeaderContentType, echo.MIMETextPlain)
				err = c.NoContent(code)
			} else {
				err = c.String(code, desc)
			}
		}
	}

	if err != nil {
		logrus.WithFields(logrus.Fields{
			"nspace": "http_error",
		}).Debugf("Cannot send the error response: %s", err)
	}
}

func wrapErr(err error, code int) error {
	if err == nil {
		return nil
	}
	if errHTTP, ok := err.(*errshttp.Error); ok {
		return errHTTP
	}
	return errshttp.NewError(code, err.Error())
}

func cacheControl(c echo.Context, rev string, maxAge time.Duration) bool {
	headers := c.Response().Header()
	headers.Set("cache-control", fmt.Sprintf("max-age=%d", int(maxAge.Seconds())))
	headers.Set("date", time.Now().UTC().Format(http.TimeFormat))

	if rev != "" {
		headers.Set("etag", rev)
		revMatches := strings.Split(c.Request().Header.Get("if-none-match"), ",")
		for _, revMatch := range revMatches {
			if strings.TrimSpace(revMatch) == rev {
				return true
			}
		}
	}

	return false
}

// stripVersion removes the 'v' prefix if any.
// ex: v1.3.2 -> 1.3.2
func stripVersion(v string) string {
	if len(v) > 0 && v[0] == 'v' {
		v = v[1:]
	}
	return v
}

func writeJSON(c echo.Context, doc interface{}) error {
	if c.Request().Method == http.MethodHead {
		c.Response().Header().Set(echo.HeaderContentType, echo.MIMEApplicationJSONCharsetUTF8)
		return c.NoContent(http.StatusOK)
	}
	return c.JSON(http.StatusOK, doc)
}

func applyVirtualSpace(handler echo.HandlerFunc, virtual base.VirtualSpace, virtualSpacename string) echo.HandlerFunc {
	return func(c echo.Context) error {
		c.Set("virtual", &virtual)
		c.Set("virtual_name", virtualSpacename)
		return handler(c)
	}
}

func filterAppInVirtualSpace(handler echo.HandlerFunc, virtual base.VirtualSpace) echo.HandlerFunc {
	return func(c echo.Context) error {
		if !virtual.AcceptApp(c.Param("app")) {
			return echo.NewHTTPError(http.StatusNotFound)
		}
		return handler(c)
	}
}

// Router sets up the HTTP routes.
func Router() *echo.Echo {
	err := initAssets()
	if err != nil {
		panic(err)
	}

	e := echo.New()
	e.HideBanner = true
	e.HidePort = true
	e.HTTPErrorHandler = httpErrorHandler

	e.Pre(middleware.RemoveTrailingSlash())
	e.Use(middleware.BodyLimit("100K"))
	e.Use(middleware.Recover())

	for _, c := range space.GetSpacesNames() {
		var groupName string
		if c == "" {
			groupName = "/registry"
		} else {
			groupName = fmt.Sprintf("/%s/registry", url.PathEscape(c))
		}
		g := e.Group(groupName, ensureSpace(c))

		g.POST("", createApp, jsonEndpoint, middleware.Gzip())
		g.PATCH("/:app", patchApp, jsonEndpoint, middleware.Gzip())
		g.POST("/:app", createVersion, jsonEndpoint, middleware.Gzip())

		g.GET("", getAppsList, jsonEndpoint, middleware.Gzip())

		g.HEAD("/pending", getPendingVersions, jsonEndpoint, middleware.Gzip())
		g.GET("/pending", getPendingVersions, jsonEndpoint, middleware.Gzip())
		g.PUT("/pending/:app/:version/approval", approvePendingVersion, middleware.Gzip())

		g.GET("/maintenance", getMaintenanceApps, jsonEndpoint, middleware.Gzip())
		g.PUT("/maintenance/:app/activate", activateMaintenanceApp, jsonEndpoint, middleware.Gzip())
		g.PUT("/maintenance/:app/deactivate", deactivateMaintenanceApp, jsonEndpoint, middleware.Gzip())

		g.HEAD("/:app", getApp, jsonEndpoint, middleware.Gzip())
		g.GET("/:app", getApp, jsonEndpoint, middleware.Gzip())
		g.GET("/:app/versions", getAppVersions, jsonEndpoint, middleware.Gzip())
		g.HEAD("/:app/:version", getVersion, jsonEndpoint, middleware.Gzip())
		g.GET("/:app/:version", getVersion, jsonEndpoint, middleware.Gzip())
		g.HEAD("/:app/:channel/latest", getLatestVersion, jsonEndpoint, middleware.Gzip())
		g.GET("/:app/:channel/latest", getLatestVersion, jsonEndpoint, middleware.Gzip())

		g.GET("/:app/icon", getAppIcon)
		g.HEAD("/:app/icon", getAppIcon)
		g.GET("/:app/partnership_icon", getAppPartnershipIcon)
		g.HEAD("/:app/partnership_icon", getAppPartnershipIcon)
		g.GET("/:app/screenshots/*", getAppScreenshot)
		g.HEAD("/:app/screenshots/*", getAppScreenshot)
		g.GET("/:app/:channel/latest/icon", getAppIcon)
		g.HEAD("/:app/:channel/latest/icon", getAppIcon)
		g.HEAD("/:app/:channel/latest/screenshots/*", getAppScreenshot)
		g.GET("/:app/:channel/latest/screenshots/*", getAppScreenshot)
		g.HEAD("/:app/:version/icon", getVersionIcon)
		g.GET("/:app/:version/icon", getVersionIcon)
		g.HEAD("/:app/:version/partnership_icon", getVersionPartnershipIcon)
		g.GET("/:app/:version/partnership_icon", getVersionPartnershipIcon)
		g.HEAD("/:app/:version/screenshots/*", getVersionScreenshot)
		g.GET("/:app/:version/screenshots/*", getVersionScreenshot)
		g.HEAD("/:app/:version/tarball/:tarball", getVersionTarball)
		g.GET("/:app/:version/tarball/:tarball", getVersionTarball)
	}

	for name, v := range base.Config.VirtualSpaces {
		groupName := fmt.Sprintf("/%s/registry", url.PathEscape(name))

		source := v.Source
		if source == base.DefaultSpacePrefix.String() {
			source = ""
		}
		g := e.Group(groupName, ensureSpace(source))

		virtualGetAppsList := applyVirtualSpace(getAppsList, v, name)
		g.GET("", virtualGetAppsList, jsonEndpoint, middleware.Gzip())

		filteredGetMaintenanceApps := filterGetMaintenanceApps(v)
		g.GET("/maintenance", filteredGetMaintenanceApps, jsonEndpoint, middleware.Gzip())

		filteredGetApp := filterAppInVirtualSpace(getApp, v)
		filteredGetAppVersions := filterAppInVirtualSpace(getAppVersions, v)
		filteredGetVersion := filterAppInVirtualSpace(getVersion, v)
		filteredGetLatestVersion := filterAppInVirtualSpace(getLatestVersion, v)
		g.HEAD("/:app", filteredGetApp, jsonEndpoint, middleware.Gzip())
		g.GET("/:app", filteredGetApp, jsonEndpoint, middleware.Gzip())
		g.GET("/:app/versions", filteredGetAppVersions, jsonEndpoint, middleware.Gzip())
		g.HEAD("/:app/:version", filteredGetVersion, jsonEndpoint, middleware.Gzip())
		g.GET("/:app/:version", filteredGetVersion, jsonEndpoint, middleware.Gzip())
		g.HEAD("/:app/:channel/latest", filteredGetLatestVersion, jsonEndpoint, middleware.Gzip())
		g.GET("/:app/:channel/latest", filteredGetLatestVersion, jsonEndpoint, middleware.Gzip())

		filteredGetAppIcon := applyVirtualSpace(filterAppInVirtualSpace(getAppIcon, v), v, name)
		filteredGetAppPartnershipIcon := filterAppInVirtualSpace(getAppPartnershipIcon, v)
		filteredGetAppScreenshot := filterAppInVirtualSpace(getAppScreenshot, v)
		filteredGetVersionIcon := applyVirtualSpace(filterAppInVirtualSpace(getVersionIcon, v), v, name)
		filteredGetVersionPartnershipIcon := filterAppInVirtualSpace(getVersionPartnershipIcon, v)
		filteredGetVersionScreenshot := filterAppInVirtualSpace(getVersionScreenshot, v)
		filteredGetVersionTarball := filterAppInVirtualSpace(getVersionTarball, v)
		g.GET("/:app/icon", filteredGetAppIcon)
		g.HEAD("/:app/icon", filteredGetAppIcon)
		g.GET("/:app/partnership_icon", filteredGetAppPartnershipIcon)
		g.HEAD("/:app/partnership_icon", filteredGetAppPartnershipIcon)
		g.GET("/:app/screenshots/*", filteredGetAppScreenshot)
		g.HEAD("/:app/screenshots/*", filteredGetAppScreenshot)
		g.GET("/:app/:channel/latest/icon", filteredGetAppIcon)
		g.HEAD("/:app/:channel/latest/icon", filteredGetAppIcon)
		g.HEAD("/:app/:channel/latest/screenshots/*", filteredGetAppScreenshot)
		g.GET("/:app/:channel/latest/screenshots/*", filteredGetAppScreenshot)
		g.HEAD("/:app/:version/icon", filteredGetVersionIcon)
		g.GET("/:app/:version/icon", filteredGetVersionIcon)
		g.HEAD("/:app/:version/partnership_icon", filteredGetVersionPartnershipIcon)
		g.GET("/:app/:version/partnership_icon", filteredGetVersionPartnershipIcon)
		g.HEAD("/:app/:version/screenshots/*", filteredGetVersionScreenshot)
		g.GET("/:app/:version/screenshots/*", filteredGetVersionScreenshot)
		g.HEAD("/:app/:version/tarball/:tarball", filteredGetVersionTarball)
		g.GET("/:app/:version/tarball/:tarball", filteredGetVersionTarball)
	}

	e.GET("/editors", getEditorsList, jsonEndpoint, middleware.Gzip())
	e.HEAD("/editors/:editor", getEditor, jsonEndpoint, middleware.Gzip())
	e.GET("/editors/:editor", getEditor, jsonEndpoint, middleware.Gzip())

	e.GET("/.well-known/:filename", universalLink, middleware.Gzip())
	e.GET("/biwebauth", webAuthRedirect)
	e.GET("/:slug", universalLinkRedirect)
	e.GET("/:slug/*", universalLinkRedirect)

	e.GET("/favicon.ico", func(c echo.Context) error {
		return c.Blob(http.StatusOK, "image/png", faviconBytes)
	})
	e.GET("/robots.txt", func(c echo.Context) error {
		return c.String(http.StatusOK, "User-agent: *\n"+
			"Disallow: /")
	}, middleware.Gzip())

	// Status routes
	StatusRoutes(e.Group("/status"))

	return e
}

// ASSETS

var faviconBytes []byte

const favicon = `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`

func initAssets() error {
	var err error
	faviconBytes, err = assetDecompress(favicon)
	return err
}

func assetDecompress(asset string) (b []byte, err error) {
	b, err = base64.StdEncoding.DecodeString(favicon)
	if err != nil {
		return
	}
	gr, err := gzip.NewReader(bytes.NewReader(b))
	if err != nil {
		return
	}
	return ioutil.ReadAll(gr)
}
