package web

import (
	"bytes"
	"fmt"
	"net/http"
	"net/url"
	"path"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/cozy/cozy-apps-registry/auth"
	"github.com/cozy/cozy-apps-registry/config"
	"github.com/cozy/cozy-apps-registry/errshttp"
	"github.com/cozy/cozy-apps-registry/registry"
	"github.com/labstack/echo/v4"
	"github.com/sirupsen/logrus"
)

// TODO remove those global variables
var editorRegistry *auth.EditorRegistry
var sessionSecret []byte

var queryFilterReg = regexp.MustCompile(`^filter\[([a-z]+)\]$`)

var (
	fiveMinute = 5 * time.Minute
	oneHour    = 1 * time.Hour
	oneYear    = 365 * 24 * time.Hour
)

func createApp(c echo.Context) (err error) {
	if err = checkAuthorized(c); err != nil {
		return err
	}

	opts := &registry.AppOptions{}
	if err = c.Bind(opts); err != nil {
		return err
	}

	editor, err := checkPermissions(c, opts.Editor, "", true /* = master */)
	if err != nil {
		return errshttp.NewError(http.StatusUnauthorized, err.Error())
	}

	if err = validateAppRequest(c, opts); err != nil {
		return err
	}

	app, err := registry.CreateApp(getSpace(c), opts, editor)
	if err != nil {
		return err
	}

	cleanApp(app)

	return c.JSON(http.StatusCreated, app)
}

func patchApp(c echo.Context) (err error) {
	if err = checkAuthorized(c); err != nil {
		return err
	}

	var opts registry.AppOptions
	if err = c.Bind(&opts); err != nil {
		return err
	}

	appSlug := c.Param("app")
	app, err := registry.FindApp(getSpace(c), appSlug, registry.Stable)
	if err != nil {
		return err
	}

	_, err = checkPermissions(c, app.Editor, "", true /* = master */)
	if err != nil {
		return errshttp.NewError(http.StatusUnauthorized, err.Error())
	}

	app, err = registry.ModifyApp(getSpace(c), appSlug, opts)
	if err != nil {
		return err
	}

	cleanApp(app)

	return c.JSON(http.StatusOK, app)
}

func createVersion(c echo.Context) (err error) {
	conf := config.GetConfig()
	if err = checkAuthorized(c); err != nil {
		return err
	}
	space := getSpace(c)
	prefix := registry.GetPrefixOrDefault(space)

	appSlug := c.Param("app")
	app, err := registry.FindApp(space, appSlug, registry.Stable)
	if err != nil {
		return err
	}

	opts := &registry.VersionOptions{}
	if err = c.Bind(opts); err != nil {
		return err
	}
	opts.Version = stripVersion(opts.Version)
	opts.Space = prefix

	editor, err := checkPermissions(c, app.Editor, app.Slug, false /* = not master */)
	if err != nil {
		return errshttp.NewError(http.StatusUnauthorized, err.Error())
	}

	if err = validateVersionRequest(c, opts); err != nil {
		return err
	}

	_, err = registry.FindVersion(getSpace(c), appSlug, opts.Version)
	if err == nil {
		return registry.ErrVersionAlreadyExists
	}
	if err != registry.ErrVersionNotFound {
		return err
	}

	// Generate the registryURL which contains the registryURL where to download
	// the file
	filename := filepath.Base(opts.URL)
	buildedURL := &url.URL{
		Scheme: c.Scheme(),
		Host:   c.Request().Host,
		Path:   fmt.Sprintf("%s/registry/%s/%s/tarball/%s", space.Prefix, appSlug, opts.Version, filename),
	}

	opts.RegistryURL = buildedURL

	ver, attachments, err := registry.DownloadVersion(opts)
	if err != nil {
		return err
	}

	if editor.AutoPublication() {
		space := getSpace(c)
		err = registry.CreateReleaseVersion(space, ver, attachments, app, true)

		// Cleaning old versions when adding a new one
		channel := registry.GetVersionChannel(ver.Version)

		// Cleaning the old versions
		channelString := registry.ChannelToStr(channel)
		if conf.CleanEnabled {
			go func() {
				err := registry.CleanOldVersions(space, ver.Slug, channelString, conf.CleanNbMonths, conf.CleanNbMajorVersions, conf.CleanNbMinorVersions, false)
				if err != nil {
					log := logrus.WithFields(logrus.Fields{
						"nspace":    "clean_version",
						"space":     space.Prefix,
						"slug":      ver.Slug,
						"version":   ver.Version,
						"channel":   channelString,
						"error_msg": err,
					})
					log.Error()
				}
			}()
		}
	} else {
		err = registry.CreatePendingVersion(getSpace(c), ver, attachments, app)
	}
	if err != nil {
		return err
	}

	cleanVersion(ver)
	return c.JSON(http.StatusCreated, ver)
}

func getPendingVersions(c echo.Context) (err error) {
	if err = checkAuthorized(c); err != nil {
		return err
	}

	editorName := c.QueryParam("editor")
	_, err = checkPermissions(c, editorName, "", true /* = master */)
	if err != nil {
		return errshttp.NewError(http.StatusUnauthorized, err.Error())
	}

	versions, err := registry.GetPendingVersions(getSpace(c))
	if err != nil {
		return errshttp.NewError(http.StatusInternalServerError, err.Error())
	}

	slugFilter := c.QueryParam("filter[slug]")
	filteredVersions := versions[:]
	for _, version := range versions {
		if slugFilter == "" || version.Slug == slugFilter {
			cleanVersion(version)
			filteredVersions = append(filteredVersions, version)
		}
	}

	return c.JSON(http.StatusOK, filteredVersions)
}

func approvePendingVersion(c echo.Context) (err error) {
	if err = checkAuthorized(c); err != nil {
		return err
	}

	// only allow approving versions from editor cozy
	editorName := "cozy"
	_, err = checkPermissions(c, editorName, "", true /* = master */)
	if err != nil {
		return errshttp.NewError(http.StatusUnauthorized, err.Error())
	}

	appSlug := c.Param("app")
	if appSlug == "" {
		return errshttp.NewError(http.StatusNotFound, "App is missing in the URL")
	}
	app, err := registry.FindApp(getSpace(c), appSlug, registry.Stable)
	if err != nil {
		return err
	}

	ver := stripVersion(c.Param("version"))
	if ver == "" {
		return errshttp.NewError(http.StatusNotFound, "Version is missing in the URL")
	}
	version, err := registry.FindPendingVersion(getSpace(c), appSlug, ver)
	if err != nil {
		return err
	}

	if version, err = registry.ApprovePendingVersion(getSpace(c), version, app); err != nil {
		return err
	}

	cleanVersion(version)

	return c.JSON(http.StatusCreated, version)
}

func getMaintenanceApps(c echo.Context) error {
	apps, err := registry.GetMaintainanceApps(getSpace(c))
	if err != nil {
		return err
	}
	return writeJSON(c, apps)
}

func activateMaintenanceApp(c echo.Context) error {
	if err := checkAuthorized(c); err != nil {
		return err
	}

	appSlug := c.Param("app")
	app, err := registry.FindApp(getSpace(c), appSlug, registry.Stable)
	if err != nil {
		return err
	}

	_, err = checkPermissions(c, app.Editor, app.Slug, true /* = master */)
	if err != nil {
		return errshttp.NewError(http.StatusUnauthorized, err.Error())
	}

	var opts registry.MaintenanceOptions
	if err = c.Bind(&opts); err != nil {
		return err
	}

	err = registry.ActivateMaintenanceApp(getSpace(c), appSlug, opts)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, echo.Map{"ok": true})
}

func deactivateMaintenanceApp(c echo.Context) (err error) {
	if err = checkAuthorized(c); err != nil {
		return
	}

	appSlug := c.Param("app")
	app, err := registry.FindApp(getSpace(c), appSlug, registry.Stable)
	if err != nil {
		return
	}

	_, err = checkPermissions(c, app.Editor, app.Slug, true /* = master */)
	if err != nil {
		return errshttp.NewError(http.StatusUnauthorized, err.Error())
	}

	err = registry.DeactivateMaintenanceApp(getSpace(c), appSlug)
	if err != nil {
		return
	}

	return c.JSON(http.StatusOK, echo.Map{"ok": true})
}

func getAppsList(c echo.Context) error {
	var filter map[string]string
	var limit, cursor int
	var sort string
	var err error
	latestVersionChannel := registry.Stable
	versionsChannel := registry.Dev
	for name, vals := range c.QueryParams() {
		val := vals[0]
		switch name {
		case "limit":
			limit, err = strconv.Atoi(val)
			if err != nil {
				return errshttp.NewError(http.StatusBadRequest,
					`Query param "limit" is invalid: %s`, err)
			}
		case "cursor":
			cursor, err = strconv.Atoi(val)
			if err != nil {
				return errshttp.NewError(http.StatusBadRequest,
					`Query param "cursor" is invalid: %s`, err)
			}
		case "sort":
			sort = val
		case "latestChannelVersion":
			latestVersionChannel, err = registry.StrToChannel(val)
			if err != nil {
				return errshttp.NewError(http.StatusBadRequest,
					`Query param "latestChannelVersion" is invalid: %s`, err)
			}
		case "versionsChannel":
			versionsChannel, err = registry.StrToChannel(val)
			if err != nil {
				return errshttp.NewError(http.StatusBadRequest,
					`Query param "versionsChannel" is invalid: %s`, err)
			}
		default:
			if queryFilterReg.MatchString(name) {
				subs := queryFilterReg.FindStringSubmatch(name)
				if len(subs) == 2 {
					if filter == nil {
						filter = make(map[string]string)
					}
					filter[subs[1]] = val
				}
			}
		}
	}

	space := getSpace(c)

	// In case of virtual space, forcing the filters
	if virtual := c.Get("virtual"); virtual != nil {
		if filter == nil {
			filter = make(map[string]string)
		}
		v := virtual.(*config.VirtualSpace)
		filter[v.Filter] = strings.Join(v.Slugs, ",")

		// Artificially altering the space prefix to force the cache to use a
		// different key
		clone := space.Clone(c.Get("virtual_name").(string))
		space = &clone
	}

	next, apps, err := registry.GetAppsList(space, &registry.AppsListOptions{
		Filters:              filter,
		Limit:                limit,
		Cursor:               cursor,
		Sort:                 sort,
		LatestVersionChannel: latestVersionChannel,
		VersionsChannel:      versionsChannel,
	})
	if err != nil {
		return err
	}

	for _, app := range apps {
		cleanApp(app)
	}

	type pageInfo struct {
		Count      int    `json:"count"`
		NextCursor string `json:"next_cursor,omitempty"`
	}

	var nextCursor string
	if next >= 0 {
		nextCursor = strconv.Itoa(next)
	}

	j := struct {
		List     []*registry.App `json:"data"`
		PageInfo pageInfo        `json:"meta"`
	}{
		List: apps,
		PageInfo: pageInfo{
			Count:      len(apps),
			NextCursor: nextCursor,
		},
	}

	return writeJSON(c, j)
}

func getApp(c echo.Context) error {
	appSlug := c.Param("app")
	app, err := registry.FindApp(getSpace(c), appSlug, getVersionsChannel(c, registry.Dev))
	if err != nil {
		return err
	}

	if cacheControl(c, app.Rev, fiveMinute) {
		return c.NoContent(http.StatusNotModified)
	}

	cleanApp(app)

	return writeJSON(c, app)
}

func getAppIcon(c echo.Context) error {
	return getAppAttachment(c, "icon")
}

func getAppPartnershipIcon(c echo.Context) error {
	return getAppAttachment(c, "partnership_icon")
}

func getAppScreenshot(c echo.Context) error {
	filename := path.Join("screenshots", c.Param("*"))
	err := getAppAttachment(c, filename)
	if err != nil {
		if errh, ok := err.(*echo.HTTPError); ok && errh.Code == http.StatusNotFound {
			err = getAppAttachment(c, path.Join("screenshots", filename))
		}
	}
	return err
}

func getAppAttachment(c echo.Context, filename string) error {
	appSlug := c.Param("app")
	channel := c.Param("channel")

	var att *registry.Attachment
	{
		if channel == "" {
			var err error
			for _, ch := range []registry.Channel{registry.Stable, registry.Beta, registry.Dev} {
				att, err = registry.FindAppAttachment(getSpace(c), appSlug, filename, ch)
				if err == nil {
					break
				}
				if err != registry.ErrVersionNotFound {
					return err
				}
			}
			if att == nil {
				return echo.NewHTTPError(http.StatusNotFound)
			}
		} else {
			ch, err := registry.StrToChannel(channel)
			if err != nil {
				ch = registry.Stable
			}
			att, err = registry.FindAppAttachment(getSpace(c), appSlug, filename, ch)
			if err != nil {
				return err
			}
		}
	}

	if cacheControl(c, att.Etag, oneHour) {
		return c.NoContent(http.StatusNotModified)
	}

	contentType := att.ContentType
	// force image/svg content-type for svg assets that start with <?xml
	if (filename == "icon" || filename == "partnership_icon") && contentType == "text/xml" {
		contentType = "image/svg+xml"
	}

	if c.Request().Method == http.MethodHead {
		c.Response().Header().Set(echo.HeaderContentType, contentType)
		return c.NoContent(http.StatusOK)
	}
	return c.Stream(http.StatusOK, contentType, att.Content)
}

func getVersionIcon(c echo.Context) error {
	return getVersionAttachment(c, "icon")
}

func getVersionPartnershipIcon(c echo.Context) error {
	return getVersionAttachment(c, "partnership_icon")
}

func getVersionScreenshot(c echo.Context) error {
	filename := path.Join("screenshots", c.Param("*"))
	err := getVersionAttachment(c, filename)
	if err != nil {
		if errh, ok := err.(*echo.HTTPError); ok && errh.Code == http.StatusNotFound {
			err = getVersionAttachment(c, path.Join("screenshots", filename))
		}
	}
	return err
}

func getVersionTarball(c echo.Context) error {
	return getVersionAttachment(c, c.Param("tarball"))
}

func getVersionAttachment(c echo.Context, filename string) error {
	appSlug := c.Param("app")
	version := c.Param("version")
	att, err := registry.FindVersionAttachment(getSpace(c), appSlug, version, filename)
	if err != nil {
		return err
	}

	contentType := att.ContentType
	// force image/svg content-type for svg assets that start with <?xml
	if (filename == "icon" || filename == "partnership_icon") && contentType == "text/xml" {
		contentType = "image/svg+xml"
	}

	c.Response().Header().Set(echo.HeaderContentType, contentType)
	if cacheControl(c, att.Etag, oneHour) {
		return c.NoContent(http.StatusNotModified)
	}

	if c.Request().Method == http.MethodHead {
		return c.NoContent(http.StatusOK)
	}

	c.Response().Header().Set(echo.HeaderContentLength, att.ContentLength)

	return c.Stream(http.StatusOK, contentType, att.Content)
}

func getAppVersions(c echo.Context) error {
	appSlug := c.Param("app")
	versions, err := registry.FindAppVersions(getSpace(c), appSlug, getVersionsChannel(c, registry.Dev), registry.Concatenated)
	if err != nil {
		return err
	}

	if cacheControl(c, "", fiveMinute) {
		return c.NoContent(http.StatusNotModified)
	}

	return writeJSON(c, versions)
}

func getVersion(c echo.Context) error {
	appSlug := c.Param("app")
	version := stripVersion(c.Param("version"))

	space := getSpace(c)
	_, err := registry.FindApp(space, appSlug, registry.Stable)
	if err != nil {
		return err
	}

	doc, err := registry.FindPublishedVersion(getSpace(c), appSlug, version)
	if err != nil {
		return err
	}

	if cacheControl(c, doc.Rev, oneYear) {
		return c.NoContent(http.StatusNotModified)
	}

	// Do not show internal identifier and revision
	doc.ID = ""
	doc.Rev = ""

	return writeJSON(c, doc)
}

func getLatestVersion(c echo.Context) error {
	appSlug := c.Param("app")
	channel := c.Param("channel")
	_, err := registry.FindApp(getSpace(c), appSlug, registry.Stable)
	if err != nil {
		return err
	}

	ch, err := registry.StrToChannel(channel)
	if err != nil {
		return err
	}
	version, err := registry.FindLatestVersion(getSpace(c), appSlug, ch)
	if err != nil {
		return err
	}

	if cacheControl(c, version.Rev, fiveMinute) {
		return c.NoContent(http.StatusNotModified)
	}

	cleanVersion(version)

	return writeJSON(c, version)
}

func universalLink(c echo.Context) error {
	space, err := getSpaceFromHost(c)
	if err != nil {
		return err
	}
	spacePrefix := registry.GetPrefixOrDefault(space)
	filename := filepath.Join(universalLinkFolder, c.Param("filename"))
	conf := config.GetConfig()
	conn := conf.SwiftConnection

	content := new(bytes.Buffer)

	hdrs, err := conn.ObjectGet(spacePrefix, filename, content, true, nil)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound)
	}

	c.Response().Header().Set(echo.HeaderContentType, hdrs["Content-Type"])
	return c.String(http.StatusOK, content.String())
}

func universalLinkRedirect(c echo.Context) error {
	space, err := getSpaceFromHost(c)
	if err != nil {
		return err
	}
	spacePrefix := registry.GetPrefixOrDefault(space)
	fallback := c.QueryParam("fallback")

	// The following code has been made to handle an iOS bug during JSON recovery.
	// It should be removed if a fix is found one day.
	// See https://openradar.appspot.com/33893852
	customScheme := c.QueryParam("custom_scheme")
	if customScheme != "" {
		customPath := c.QueryParam("custom_path")
		code := c.QueryParam("code")
		state := c.QueryParam("state")
		accessCode := c.QueryParam("access_code")

		if code != "" {
			customScheme := strings.TrimSuffix(customScheme, "://")

			params := url.Values{}
			params.Add("code", code)
			params.Add("state", state)
			params.Add("access_code", accessCode)

			redirect := url.URL{
				Scheme: customScheme,
				Path:   customPath,
			}
			redirect.RawQuery = params.Encode()

			return c.Redirect(http.StatusSeeOther, redirect.String())
		}
	}

	if fallback == "" {
		return echo.NewHTTPError(http.StatusNotFound)
	}

	// Disallow redirection for untrusted domains
	parsedRedirect, err := url.Parse(fallback)
	if err != nil {
		return err
	}

	spaceTrustedDomains := config.GetConfig().TrustedDomains
	if domains, ok := spaceTrustedDomains[spacePrefix]; ok {
		for _, domain := range domains {
			if strings.Contains(parsedRedirect.Host, domain) {
				return c.Redirect(http.StatusSeeOther, fallback)
			}
		}
	}
	return echo.NewHTTPError(http.StatusBadRequest, "This domain is not allowed to be redirected")
}

func getEditor(c echo.Context) error {
	editorName := c.Param("editor")
	editor, err := editorRegistry.GetEditor(editorName)
	if err != nil {
		return err
	}

	if cacheControl(c, "", fiveMinute) {
		return c.NoContent(http.StatusNotModified)
	}

	return writeJSON(c, editor)
}

func getEditorsList(c echo.Context) error {
	editors, err := editorRegistry.AllEditors()
	if err != nil {
		return err
	}
	return writeJSON(c, editors)
}
