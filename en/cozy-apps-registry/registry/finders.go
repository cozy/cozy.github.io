package registry

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/spf13/viper"

	"github.com/cozy/cozy-apps-registry/cache"
	"github.com/cozy/echo"
	"github.com/go-kivik/kivik"
)

var validFilters = []string{
	"type",
	"editor",
	"tags",
	"locales",
}

var validSorts = []string{
	"slug",
	"type",
	"editor",
	"created_at",
}

const maxLimit = 200

func getVersionID(appSlug, version string) string {
	return getAppID(appSlug) + "-" + version
}

func getAppID(appSlug string) string {
	return strings.ToLower(appSlug)
}

func findApp(c *Space, appSlug string) (*App, error) {
	if !validSlugReg.MatchString(appSlug) {
		return nil, ErrAppSlugInvalid
	}

	var doc *App
	var err error

	db := c.AppsDB()
	row := db.Get(ctx, getAppID(appSlug))
	if err = row.ScanDoc(&doc); err != nil {
		if kivik.StatusCode(err) == http.StatusNotFound {
			return nil, ErrAppNotFound
		}
		return nil, err
	}

	return doc, nil
}

func FindApp(c *Space, appSlug string, channel Channel) (*App, error) {
	doc, err := findApp(c, appSlug)
	if err != nil {
		return nil, err
	}

	doc.DataUsageCommitment, doc.DataUsageCommitmentBy = defaultDataUserCommitment(doc, nil)
	doc.Versions, err = FindAppVersions(c, doc.Slug, channel)
	if err != nil {
		return nil, err
	}
	doc.LatestVersion, err = FindLatestVersion(c, doc.Slug, Stable)
	if err != nil && err != ErrVersionNotFound {
		return nil, err
	}
	doc.Label = calculateAppLabel(doc, doc.LatestVersion)

	return doc, nil
}

func FindAppAttachment(c *Space, appSlug, filename string, channel Channel) (*kivik.Attachment, error) {
	if !validSlugReg.MatchString(appSlug) {
		return nil, ErrAppSlugInvalid
	}

	ver, err := FindLatestVersion(c, appSlug, channel)
	if err != nil {
		return nil, err
	}

	return FindVersionAttachment(c, appSlug, ver.Version, filename)
}

func FindVersionAttachment(c *Space, appSlug, version, filename string) (*kivik.Attachment, error) {
	db := c.VersDB()

	att, err := db.GetAttachment(ctx, getVersionID(appSlug, version), "", filename)
	if err != nil {
		if kivik.StatusCode(err) == http.StatusNotFound {
			return nil, echo.NewHTTPError(http.StatusNotFound, fmt.Sprintf("Could not find attachment %q", filename))
		}
		return nil, err
	}

	return att, nil
}

func findVersion(appSlug, version string, dbs ...*kivik.DB) (*Version, error) {
	if !validSlugReg.MatchString(appSlug) {
		return nil, ErrAppSlugInvalid
	}
	if !validVersionReg.MatchString(version) {
		return nil, ErrVersionInvalid
	}

	for _, db := range dbs {
		row := db.Get(ctx, getVersionID(appSlug, version))

		var doc *Version
		err := row.ScanDoc(&doc)
		if err != nil {
			// We got error
			if kivik.StatusCode(err) != http.StatusNotFound {
				// And this is a real error
				return nil, err
			}
		} else {
			// We have a doc
			return doc, nil
		}
	}

	return nil, ErrVersionNotFound
}

func FindPendingVersion(c *Space, appSlug, version string) (*Version, error) {
	// Test for pending version
	return findVersion(appSlug, version, c.dbPendingVers)
}

func FindPublishedVersion(c *Space, appSlug, version string) (*Version, error) {
	// Test for released version only
	return findVersion(appSlug, version, c.dbVers)
}

func FindVersion(c *Space, appSlug, version string) (*Version, error) {
	// Test for pending and released version
	return findVersion(appSlug, version, c.dbVers, c.dbPendingVers)
}

func versionViewQuery(c *Space, db *kivik.DB, appSlug, channel string, opts map[string]interface{}) (*kivik.Rows, error) {
	rows, err := db.Query(ctx, versViewDocName(appSlug), channel, opts)
	if err != nil {
		if kivik.StatusCode(err) == http.StatusNotFound {
			if err = createVersionsViews(c, db, appSlug); err != nil {
				return nil, err
			}
			return versionViewQuery(c, db, appSlug, channel, opts)
		}
		return nil, err
	}
	return rows, nil
}

func FindLatestVersion(c *Space, appSlug string, channel Channel) (*Version, error) {
	if !validSlugReg.MatchString(appSlug) {
		return nil, ErrAppSlugInvalid
	}

	channelStr := channelToStr(channel)

	key := cache.Key(c.prefix + "/" + appSlug + "/" + channelStr)
	cacheVersionsLatest := viper.Get("cacheVersionsLatest").(cache.Cache)
	if data, ok := cacheVersionsLatest.Get(key); ok {
		var latestVersion *Version
		if err := json.Unmarshal(data, &latestVersion); err == nil {
			return latestVersion, nil
		}
	}

	db := c.VersDB()
	rows, err := versionViewQuery(c, db, appSlug, channelStr, map[string]interface{}{
		"limit":        1,
		"descending":   true,
		"include_docs": true,
	})
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	if !rows.Next() {
		return nil, ErrVersionNotFound
	}

	var data json.RawMessage
	var latestVersion *Version
	if err = rows.ScanDoc(&data); err != nil {
		return nil, err
	}
	if err = json.Unmarshal(data, &latestVersion); err != nil {
		return nil, err
	}

	latestVersion.ID = ""
	latestVersion.Rev = ""
	latestVersion.Attachments = nil

	cacheVersionsLatest.Add(key, cache.Value(data))
	return latestVersion, nil
}

func FindAppVersions(c *Space, appSlug string, channel Channel) (*AppVersions, error) {
	db := c.VersDB()

	key := cache.Key(c.prefix + "/" + appSlug + "/" + channelToStr(channel))
	cacheVersionsList := viper.Get("cacheVersionsList").(cache.Cache)
	if data, ok := cacheVersionsList.Get(key); ok {
		var versions *AppVersions
		if err := json.Unmarshal(data, &versions); err == nil {
			return versions, nil
		}
	}

	rows, err := versionViewQuery(c, db, appSlug, "dev", map[string]interface{}{
		"limit":      2000,
		"descending": false,
	})
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	allVersions := make([]string, int(rows.TotalRows()))
	for rows.Next() {
		var version string
		if err = rows.ScanValue(&version); err != nil {
			return nil, err
		}
		allVersions = append(allVersions, version)
	}

	var stable, beta, dev []string
	if channel == Dev {
		dev = allVersions
	}

	for _, v := range allVersions {
		switch GetVersionChannel(v) {
		case Stable:
			stable = append(stable, v)
			fallthrough
		case Beta:
			if channel == Beta || channel == Dev {
				beta = append(beta, v)
			}
		case Dev:
			// do nothing
		default:
			panic("unreachable")
		}
	}

	versions := &AppVersions{
		HasVersions: len(allVersions) > 0,
		Stable:      stable,
		Beta:        beta,
		Dev:         dev,
	}

	if data, err := json.Marshal(versions); err == nil {
		cacheVersionsList.Add(key, data)
	}

	return versions, nil
}

type AppsListOptions struct {
	Limit                int
	Cursor               int
	Sort                 string
	Filters              map[string]string
	LatestVersionChannel Channel
	VersionsChannel      Channel
}

func GetPendingVersions(c *Space) ([]*Version, error) {
	db := c.dbPendingVers
	rows, err := db.AllDocs(ctx, map[string]interface{}{
		"include_docs": true,
	})
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	versions := make([]*Version, 0)
	for rows.Next() {
		if strings.HasPrefix(rows.ID(), "_design") {
			continue
		}

		var version *Version
		if err := rows.ScanDoc(&version); err != nil {
			return nil, err
		}
		versions = append(versions, version)
	}

	return versions, nil
}

func GetAppsList(c *Space, opts *AppsListOptions) (int, []*App, error) {
	db := c.AppsDB()
	order := "asc"

	sortField := opts.Sort
	if len(sortField) > 0 && sortField[0] == '-' {
		order = "desc"
		sortField = sortField[1:]
	}
	if sortField == "" || !stringInArray(sortField, validSorts) {
		sortField = "slug"
	}

	useIndex := appIndexName(sortField)
	sortFields := appsIndexes[sortField]
	sort := ""
	for _, field := range sortFields {
		if sort != "" {
			sort += ","
		}
		sort += fmt.Sprintf(`{"%s": "%s"}`, field, order)
	}

	selector := ``
	for name, val := range opts.Filters {
		if !stringInArray(name, validFilters) {
			continue
		}
		if selector != "" {
			selector += ","
		}
		switch name {
		case "tags", "locales":
			tags := strings.Split(val, ",")
			selector += string(sprintfJSON(`%s: {"$all": %s}`, name, tags))
		default:
			selector += string(sprintfJSON("%s: %s", name, val))
		}
	}
	if selector == "" {
		selector = string(sprintfJSON(`%s: {"$gt": null}`, sortField))
	}

	if opts.Limit == 0 {
		opts.Limit = 50
	} else if opts.Limit > maxLimit {
		opts.Limit = maxLimit
	}

	designsCount := len(appsIndexes)
	limit := opts.Limit + designsCount + 1
	cursor := opts.Cursor
	req := sprintfJSON(`{
  "use_index": %s,
  "selector": {`+selector+`},
  "skip": %s,
  "sort": [`+sort+`],
  "limit": %s
}`, useIndex, cursor, limit)

	rows, err := db.Find(ctx, req)
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()

	res := make([]*App, 0)
	for rows.Next() {
		if strings.HasPrefix(rows.ID(), "_design") {
			continue
		}
		var doc *App
		if err = rows.ScanDoc(&doc); err != nil {
			return 0, nil, err
		}
		res = append(res, doc)
	}
	if len(res) == 0 {
		return -1, res, nil
	}

	if len(res) > opts.Limit {
		res = res[:opts.Limit]
		cursor += len(res)
	} else {
		// we fetch one more element so we know in this case the end of the list
		// has been reached.
		cursor = -1
	}

	for _, app := range res {
		app.DataUsageCommitment, app.DataUsageCommitmentBy = defaultDataUserCommitment(app, nil)
		app.Versions, err = FindAppVersions(c, app.Slug, opts.VersionsChannel)
		if err != nil {
			return 0, nil, err
		}
		app.LatestVersion, err = FindLatestVersion(c, app.Slug, opts.LatestVersionChannel)
		if err != nil && err != ErrVersionNotFound {
			return 0, nil, err
		}
		app.Label = calculateAppLabel(app, app.LatestVersion)
	}

	return cursor, res, nil
}

func GetMaintainanceApps(c *Space) ([]*App, error) {
	useIndex := appIndexName("maintenance")
	req := sprintfJSON(`{
  "use_index": %s,
  "selector": {"maintenance_activated": true},
  "limit": 1000
}`, useIndex)
	rows, err := c.dbApps.Find(ctx, req)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	apps := make([]*App, 0)
	for rows.Next() {
		var app App
		if strings.HasPrefix(rows.ID(), "_design") {
			continue
		}
		if err = rows.ScanDoc(&app); err != nil {
			return nil, err
		}
		apps = append(apps, &app)
	}

	return apps, nil
}
