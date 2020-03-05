package web

import (
	"fmt"
	"net/http"
	"net/url"
	"path"
	"path/filepath"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/errshttp"
	"github.com/cozy/cozy-apps-registry/registry"
	"github.com/labstack/echo/v4"
	"github.com/sirupsen/logrus"
)

func createVersion(c echo.Context) (err error) {
	if err = checkAuthorized(c); err != nil {
		return err
	}
	space := getSpace(c)
	prefix := space.GetPrefix()

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
	opts.SpacePrefix = prefix

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
		if base.Config.CleanEnabled {
			go func() {
				err := registry.CleanOldVersions(space, ver.Slug, channelString,
					base.Config.CleanParameters, registry.RealRun)
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
