package web

import (
	"fmt"
	"net/http"
	"path"
	"regexp"
	"strconv"
	"strings"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/errshttp"
	"github.com/cozy/cozy-apps-registry/registry"
	"github.com/cozy/cozy-apps-registry/space"
	"github.com/labstack/echo/v4"
)

var queryFilterReg = regexp.MustCompile(`^filter\[([a-z]+)\]$`)

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

	virtual, _, err := getVirtualSpace(c)
	if err != nil {
		return err
	}

	var att *registry.Attachment
	attFound := false
	if virtual != nil {
		if att, attFound, err = registry.FindAttachmentFromOverwrite(virtual, appSlug, filename); err != nil {
			return err
		}
	}
	if !attFound {
		if channel == "" {
			var err error
			for _, ch := range registry.Channels {
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

func getMaintenanceApps(c echo.Context) error {
	apps, err := registry.GetMaintainanceApps(getSpace(c))
	if err != nil {
		return err
	}
	return writeJSON(c, apps)
}

func getVirtualSpace(c echo.Context) (*base.VirtualSpace, *space.Space, error) {
	var s *space.Space
	var virtualSpace *base.VirtualSpace = nil
	virtualSpaceName, ok := c.Get("virtual_name").(string)
	if ok && virtualSpaceName != "" {
		tmp, ok := base.Config.VirtualSpaces[virtualSpaceName]
		if !ok {
			return nil, nil, fmt.Errorf("unable to find virtual space %s", virtualSpaceName)
		}

		virtualSpace = &tmp
		spaceName := tmp.Source
		s, ok = space.GetSpace(spaceName)
		if !ok {
			return nil, nil, fmt.Errorf("unable to find space %s", spaceName)
		}
	} else {
		s = getSpace(c)
	}
	return virtualSpace, s, nil
}

func activateMaintenanceApp(c echo.Context) error {
	if err := checkAuthorized(c); err != nil {
		return err
	}

	vs, s, err := getVirtualSpace(c)
	if err != nil {
		return err
	}

	appSlug := c.Param("app")
	app, err := registry.FindApp(s, appSlug, registry.Stable)
	if err != nil {
		return err
	}

	_, err = checkPermissions(c, app.Editor, app.Slug, true /* = master */)
	if err != nil {
		return errshttp.NewError(http.StatusUnauthorized, err.Error())
	}

	var opts registry.MaintenanceOptions
	if err := c.Bind(&opts); err != nil {
		return err
	}

	if vs != nil {
		err = registry.ActivateMaintenanceVirtualSpace(vs.Name, appSlug, opts)
	} else {
		err = registry.ActivateMaintenanceApp(s, appSlug, opts)
	}
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, echo.Map{"ok": true})
}

func deactivateMaintenanceApp(c echo.Context) (err error) {
	if err = checkAuthorized(c); err != nil {
		return
	}

	vs, s, err := getVirtualSpace(c)
	if err != nil {
		return err
	}

	appSlug := c.Param("app")
	app, err := registry.FindApp(s, appSlug, registry.Stable)
	if err != nil {
		return
	}

	_, err = checkPermissions(c, app.Editor, app.Slug, true /* = master */)
	if err != nil {
		return errshttp.NewError(http.StatusUnauthorized, err.Error())
	}

	if vs != nil {
		err = registry.DeactivateMaintenanceVirtualSpace(vs.Name, appSlug)
	} else {
		err = registry.DeactivateMaintenanceApp(s, appSlug)
	}
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, echo.Map{"ok": true})
}

// TODO: to improve the performances of pagination, we should use bookmarks for
// the find with mango request instead of skip.
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
		v := virtual.(*base.VirtualSpace)
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
