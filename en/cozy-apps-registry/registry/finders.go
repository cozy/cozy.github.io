package registry

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/Masterminds/semver"
	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/space"
	"github.com/go-kivik/kivik/v3"
	"github.com/ncw/swift"
	"github.com/sirupsen/logrus"
)

var validFilters = []string{
	"type",
	"editor",
	"tags",
	"locales",
	"select",
	"reject",
}

var validSorts = []string{
	"slug",
	"type",
	"editor",
	"created_at",
}

// ConcatChannels type
type ConcatChannels bool

const (
	Concatenated    ConcatChannels = true
	NotConcatenated ConcatChannels = false
)

const maxLimit = 200

func getVersionID(appSlug, version string) string {
	return getAppID(appSlug) + "-" + version
}

func getAppID(appSlug string) string {
	return strings.ToLower(appSlug)
}

func findApp(c *space.Space, appSlug string) (*App, error) {
	if !validSlugReg.MatchString(appSlug) {
		return nil, ErrAppSlugInvalid
	}

	var doc *App
	var err error

	db := c.AppsDB()
	row := db.Get(context.Background(), getAppID(appSlug))
	if err = row.ScanDoc(&doc); err != nil {
		if kivik.StatusCode(err) == http.StatusNotFound {
			return nil, ErrAppNotFound
		}
		return nil, err
	}

	return doc, nil
}

func FindApp(c *space.Space, appSlug string, channel Channel) (*App, error) {
	doc, err := findApp(c, appSlug)
	if err != nil {
		return nil, err
	}

	doc.DataUsageCommitment, doc.DataUsageCommitmentBy = defaultDataUserCommitment(doc, nil)
	doc.Versions, err = FindAppVersions(c, doc.Slug, channel, Concatenated)
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

type Attachment struct {
	ContentType   string
	Content       io.Reader
	Etag          string
	ContentLength string
}

func FindAppAttachment(c *space.Space, appSlug, filename string, channel Channel) (*Attachment, error) {
	if !validSlugReg.MatchString(appSlug) {
		return nil, ErrAppSlugInvalid
	}

	ver, err := FindLatestVersion(c, appSlug, channel)
	if err != nil {
		return nil, err
	}

	return FindVersionAttachment(c, appSlug, ver.Version, filename)
}

func FindVersionAttachment(c *space.Space, appSlug, version, filename string) (*Attachment, error) {
	var headers swift.Headers
	var shasum, contentType string
	var fileContent []byte

	var contentBuffer *bytes.Buffer
	fp := filepath.Join(appSlug, version, filename)

	// First, we try to get the version from CouchDB
	ver, err := FindVersion(c, appSlug, version)
	if err != nil {
		return nil, err
	}

	// Checks if the asset from the global database is referenced in the Version
	// document
	shasum, ok := ver.AttachmentReferences[filename]

	if ok {
		contentBuffer, headers, err = base.GlobalAssetStore.Get(shasum)
		if err != nil {
			return nil, err
		}
	} else {
		// If we cannot find it, we try from the app swift container as a fallback
		prefix := c.GetPrefix()
		contentBuffer, headers, err = base.Storage.Get(prefix, fp)
		if err != nil {
			return nil, err
		}
	}

	fileContent = contentBuffer.Bytes()
	contentType = headers["Content-Type"]

	// If the asset was not found in the global database, move it for the next
	// time.
	if !ok {
		go func() {
			err = MoveAssetToGlobalDatabase(c, ver, fileContent, filename, contentType)
			if err != nil {
				log := logrus.WithFields(logrus.Fields{
					"nspace":    "move_asset",
					"space":     c.Name,
					"slug":      appSlug,
					"version":   version,
					"filename":  filename,
					"error_msg": err,
				})
				log.Error()
			}
		}()
	}

	content := bytes.NewReader(fileContent)

	att := &Attachment{
		ContentType:   contentType,
		Content:       content,
		Etag:          headers["Etag"],
		ContentLength: headers["Content-Length"],
	}
	return att, nil
}

// MoveAssetToGlobalDatabase moves an asset located in the "local" container in
// the global database. This function is not intended to stay forever and will
// be removed when no more assets will be remaining in the app containers.
// It does the following steps:
// 1. Creating the new asset object in the global database
// 2. Adds a reference to the asset in the couch version document
// 3. Removes the old asset location
func MoveAssetToGlobalDatabase(c *space.Space, ver *Version, content []byte, filename, contentType string) error {
	globalFilepath := filepath.Join(c.Name, ver.Slug, ver.Version)

	a := &base.Asset{
		Name:        filename,
		AppSlug:     ver.Slug,
		ContentType: contentType,
	}

	err := base.GlobalAssetStore.Add(a, bytes.NewReader(content), globalFilepath)
	if err != nil {
		return err
	}

	// Updating the couch document
	if ver.AttachmentReferences == nil {
		ver.AttachmentReferences = make(map[string]string)
	}
	ver.AttachmentReferences[filename] = a.Shasum

	db := c.VersDB()
	_, err = db.Put(context.Background(), ver.ID, ver)
	if err != nil {
		return err
	}

	// Remove the old object
	prefix := c.GetPrefix()
	return base.Storage.Remove(prefix, filename)
}

func findVersion(appSlug, version string, dbs ...*kivik.DB) (*Version, error) {
	if !validSlugReg.MatchString(appSlug) {
		return nil, ErrAppSlugInvalid
	}
	if !validVersionReg.MatchString(version) {
		return nil, ErrVersionInvalid
	}

	for _, db := range dbs {
		row := db.Get(context.Background(), getVersionID(appSlug, version))

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

func FindPendingVersion(c *space.Space, appSlug, version string) (*Version, error) {
	// Test for pending version
	return findVersion(appSlug, version, c.PendingVersDB())
}

func FindPublishedVersion(c *space.Space, appSlug, version string) (*Version, error) {
	// Test for released version only
	return findVersion(appSlug, version, c.VersDB())
}

func FindVersion(c *space.Space, appSlug, version string) (*Version, error) {
	// Test for pending and released version
	return findVersion(appSlug, version, c.VersDB(), c.PendingVersDB())
}

func versionViewQuery(c *space.Space, db *kivik.DB, appSlug, channel string, opts map[string]interface{}) (*kivik.Rows, error) {
	rows, err := db.Query(context.Background(), space.VersViewDocName(appSlug), channel, opts)
	if err != nil {
		if kivik.StatusCode(err) == http.StatusNotFound {
			if err = space.CreateVersionsViews(c, db, appSlug); err != nil {
				return nil, err
			}
			return versionViewQuery(c, db, appSlug, channel, opts)
		}
		return nil, err
	}
	return rows, nil
}

// FindLastsVersionsSince returns versions of a channel up to a date
//
// Example: FindLastsVersionSince("foo", "stable", myDate) returns all the
// versions created beetween myDate and now
func FindLastsVersionsSince(c *space.Space, appSlug, channel string, date time.Time) ([]*Version, error) {
	db := c.VersDB()
	versions := []*Version{}

	options := map[string]interface{}{
		"startkey":     date.Format(time.RFC3339Nano),
		"include_docs": true,
	}

	rows, err := db.Query(context.Background(), "by-date", channel, options)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var version *Version
		if err := rows.ScanDoc(&version); err != nil {
			return nil, err
		}
		// Filter by version
		if version.Slug == appSlug {
			versions = append(versions, version)
		}
	}
	return versions, nil
}

// findPreviousMinor tries to find the old previous minor version of semver-type
// versions
func findPreviousMinor(version string, versions []string) (string, bool) {
	vs := []*semver.Version{}
	currentVersion, _ := semver.NewVersion(version)

	// Init
	for _, v := range versions {
		sv, _ := semver.NewVersion(v)
		vs = append(vs, sv)
	}

	// Sorting by reverse
	sort.Sort(sort.Reverse(semver.Collection(vs)))

	// Create constraints
	major := currentVersion.Major()
	minor := currentVersion.Minor()
	patch := currentVersion.Patch()
	notActualMinor, _ := semver.NewConstraint(fmt.Sprintf("< %s.%s.%s", strconv.FormatInt(major, 10), strconv.FormatInt(minor, 10), strconv.FormatInt(patch, 10))) // Try to get the next minor version
	inMajor, _ := semver.NewConstraint(fmt.Sprintf(">= %s", strconv.FormatInt(major, 10)))

	// Finding
	for _, v := range vs {
		if inMajor.Check(v) && notActualMinor.Check(v) {
			return v.Original(), true
		}
	}
	return "", false
}

// findPreviousMajor tries to find the old previous major version of semver-type
// versions
func findPreviousMajor(version string, versions []string) (string, bool) {
	vs := []*semver.Version{}
	currentVersion, _ := semver.NewVersion(version)

	// Init
	for _, v := range versions {
		sv, _ := semver.NewVersion(v)
		vs = append(vs, sv)
	}

	// Sorting by reverse
	sort.Sort(sort.Reverse(semver.Collection(vs)))

	// Create constraints
	major := currentVersion.Major()
	previousMajor, _ := semver.NewConstraint(fmt.Sprintf("< %s.0.0", strconv.FormatInt(major, 10)))

	// Finding
	for _, v := range vs {
		if previousMajor.Check(v) {
			return v.Original(), true
		}
	}
	return "", false
}

// FindLastNVersions returns the N lasts versions of an app
// If N is greater than available versions, only available are returned
func FindLastNVersions(c *space.Space, appSlug string, channelStr string, nMajor, nMinor int) ([]*Version, error) {
	channel, err := StrToChannel(channelStr)
	if err != nil {
		return nil, err
	}
	versions, err := FindAppVersions(c, appSlug, channel, NotConcatenated)
	if err != nil {
		return nil, err
	}
	latestVersion, err := FindLatestVersion(c, appSlug, channel)
	if err != nil {
		return nil, err
	}
	var versionsList []string

	switch channel {
	case Stable:
		versionsList = versions.Stable
	case Beta:
		versionsList = versions.Beta
	case Dev:
		versionsList = versions.Dev
	}

	resVersions := []string{}
	minor := latestVersion.Version
	major := latestVersion.Version

	majors := []string{}

	for len(majors) < nMajor {
		minors := []string{}
		minors = append(minors, minor)
		majors = append(majors, major)

		for len(minors) < nMinor+1 {
			previousMinor, ok := findPreviousMinor(minor, versionsList)
			if ok {
				minors = append(minors, previousMinor)
				minor = previousMinor
				continue
			} else {
				// No more versions available, append, clean & break
				resVersions = append(resVersions, minors...)
				minors = []string{}
				break
			}
		}

		// Append to final result
		resVersions = append(resVersions, minors...)

		major, ok := findPreviousMajor(major, versionsList)
		if ok {
			minor = major
		} else {
			break
		}
	}
	returned := []*Version{}

	for _, toReturn := range resVersions {
		v, err := FindVersion(c, appSlug, toReturn)
		if err != nil {
			return nil, err
		}
		returned = append(returned, v)
	}
	return returned, nil
}

func FindLatestVersion(c *space.Space, appSlug string, channel Channel) (*Version, error) {
	// Try to get the latest version from the cache
	key := base.NewKey(c.Name, appSlug, ChannelToStr(channel))
	if data, ok := base.LatestVersionsCache.Get(key); ok {
		var latestVersion *Version
		if err := json.Unmarshal(data, &latestVersion); err == nil {
			return latestVersion, nil
		}
	}

	return FindLatestVersionCacheMiss(c, appSlug, channel)
}

func FindLatestVersionCacheMiss(c *space.Space, appSlug string, channel Channel) (*Version, error) {
	if !validSlugReg.MatchString(appSlug) {
		return nil, ErrAppSlugInvalid
	}

	channelStr := ChannelToStr(channel)

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

	// Update the cache by using a goroutine to avoid waiting for the latency
	// between the app server and redis.
	key := base.NewKey(c.Name, appSlug, channelStr)
	go base.LatestVersionsCache.Add(key, base.Value(data))

	return latestVersion, nil
}

// FindAppVersions return all the app versions. The concat params allows you to
// concatenate stable & beta versions in dev list, and stable versions in beta
// list
func FindAppVersions(c *space.Space, appSlug string, channel Channel, concat ConcatChannels) (*AppVersions, error) {
	// Try to get the app versions from the cache
	key := base.NewKey(c.Name, appSlug, ChannelToStr(channel))
	if data, ok := base.ListVersionsCache.Get(key); ok {
		var versions *AppVersions
		if err := json.Unmarshal(data, &versions); err == nil {
			return versions, nil
		}
	}

	return FindAppVersionsCacheMiss(c, appSlug, channel, concat)
}

func FindAppVersionsCacheMiss(c *space.Space, appSlug string, channel Channel, concat ConcatChannels) (*AppVersions, error) {
	db := c.VersDB()

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
	if concat {
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
	} else {
		for _, v := range allVersions {
			switch GetVersionChannel(v) {
			case Stable:
				stable = append(stable, v)
			case Beta:
				beta = append(beta, v)
			case Dev:
				dev = append(dev, v)
			default:
				panic("unreachable")
			}
		}
	}

	versions := &AppVersions{
		HasVersions: len(allVersions) > 0,
		Stable:      stable,
		Beta:        beta,
		Dev:         dev,
	}

	// Update the cache by using a goroutine to avoid waiting for the latency
	// between the app server and redis.
	if data, err := json.Marshal(versions); err == nil {
		key := base.NewKey(c.Name, appSlug, ChannelToStr(channel))
		go base.ListVersionsCache.Add(key, data)
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

func GetPendingVersions(c *space.Space) ([]*Version, error) {
	db := c.PendingVersDB()
	rows, err := db.AllDocs(context.Background(), map[string]interface{}{
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

// GetAppChannelVersions returns the versions list of an app channel
func GetAppChannelVersions(c *space.Space, appSlug string, channel Channel) ([]*Version, error) {
	var versions []string
	var resultVersions []*Version

	fv, err := FindAppVersions(c, appSlug, channel, NotConcatenated)
	if err != nil {
		return nil, err
	}
	switch channel {
	case Stable:
		versions = fv.Stable
	case Beta:
		versions = fv.Beta
	case Dev:
		versions = fv.Dev
	}
	for _, v := range versions {
		vers, err := FindVersion(c, appSlug, v)
		if err != nil {
			return nil, err
		}
		resultVersions = append(resultVersions, vers)
	}

	return resultVersions, nil
}

func GetAppsList(c *space.Space, opts *AppsListOptions) (int, []*App, error) {
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

	useIndex := space.AppIndexName(sortField)
	sortFields := space.AppsIndexes[sortField]
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
			selector += string(base.SprintfJSON(`%s: {"$all": %s}`, name, tags))
		case "select":
			slugs := strings.Split(val, ",")
			selector += string(base.SprintfJSON(`"slug": {"$in": %s}`, slugs))
		case "reject":
			slugs := strings.Split(val, ",")
			selector += string(base.SprintfJSON(`"slug": {"$nin": %s}`, slugs))
		default:
			selector += string(base.SprintfJSON("%s: %s", name, val))
		}
	}
	if selector == "" {
		selector = string(base.SprintfJSON(`%s: {"$gt": null}`, sortField))
	}

	if opts.Limit == 0 {
		opts.Limit = 50
	} else if opts.Limit > maxLimit {
		opts.Limit = maxLimit
	}

	designsCount := len(space.AppsIndexes)
	limit := opts.Limit + designsCount + 1
	cursor := opts.Cursor
	req := base.SprintfJSON(`{
  "use_index": %s,
  "selector": {`+selector+`},
  "skip": %s,
  "sort": [`+sort+`],
  "limit": %s
}`, useIndex, cursor, limit)

	rows, err := db.Find(context.Background(), req)
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

	// We are doing a lot of requests to cache or couchdb to fetch the data
	// about the versions of each app. It would be better to avoid the n+1
	// requests, but as a quick hack to limit the latency, we are using a pool
	// of goroutines to parallelize the work.
	const parallelVersionFinder = 8
	done := make(chan error)
	work := make(chan *appVersionEntry)
	stop := make(chan struct{})

	for i := 0; i < parallelVersionFinder; i++ {
		go func() {
			for {
				select {
				case app := <-work:
					done <- fillAppVersions(c, opts, app)
				case <-stop:
					return
				}
			}
		}()
	}

	versionsCache := GetVersionsListFromCache(c, ChannelToStr(opts.VersionsChannel), res)
	latestCache := GetVersionsLatestFromCache(c, ChannelToStr(opts.LatestVersionChannel), res)
	for i, app := range res {
		go func(app *App, cachedVersions *AppVersions, cachedLatest *Version) {
			work <- &appVersionEntry{
				app,
				cachedVersions,
				cachedLatest,
			}
		}(app, versionsCache[i], latestCache[i])
	}

	for range res {
		if e := <-done; e != nil {
			err = e
		}
	}

	for i := 0; i < parallelVersionFinder; i++ {
		stop <- struct{}{}
	}

	if err != nil {
		return 0, nil, err
	}

	return cursor, res, nil
}

type appVersionEntry struct {
	app            *App
	cachedVersions *AppVersions
	cachedLatest   *Version
}

func fillAppVersions(c *space.Space, opts *AppsListOptions, entry *appVersionEntry) error {
	var err error
	app := entry.app

	app.Versions = entry.cachedVersions
	if app.Versions == nil {
		app.Versions, err = FindAppVersionsCacheMiss(c, app.Slug, opts.VersionsChannel, Concatenated)
		if err != nil {
			return err
		}
	}

	app.LatestVersion = entry.cachedLatest
	if app.LatestVersion == nil {
		app.LatestVersion, err = FindLatestVersionCacheMiss(c, app.Slug, opts.LatestVersionChannel)
		if err != nil && err != ErrVersionNotFound {
			return err
		}
	}

	app.DataUsageCommitment, app.DataUsageCommitmentBy = defaultDataUserCommitment(app, nil)
	app.Label = calculateAppLabel(app, app.LatestVersion)
	return nil
}

func GetVersionsListFromCache(c *space.Space, channelStr string, apps []*App) []*AppVersions {
	keys := make([]base.Key, len(apps))
	for i, app := range apps {
		keys[i] = base.NewKey(c.Name, app.Slug, channelStr)
	}

	cachedList := base.ListVersionsCache.MGet(keys)
	versionsList := make([]*AppVersions, len(apps))
	for i, entry := range cachedList {
		if entry != nil {
			var versions *AppVersions
			versionsReader := bytes.NewReader(entry.([]byte))
			if err := json.NewDecoder(versionsReader).Decode(&versions); err == nil {
				versionsList[i] = versions
			}
		}
	}

	return versionsList
}

func GetVersionsLatestFromCache(c *space.Space, channelStr string, apps []*App) []*Version {
	keys := make([]base.Key, len(apps))
	for i, app := range apps {
		keys[i] = base.NewKey(c.Name, app.Slug, channelStr)
	}

	cachedList := base.LatestVersionsCache.MGet(keys)
	latestList := make([]*Version, len(apps))
	for i, entry := range cachedList {
		if entry != nil {
			var latest *Version
			latestReader := bytes.NewReader(entry.([]byte))
			if err := json.NewDecoder(latestReader).Decode(&latest); err == nil {
				latestList[i] = latest
			}
		}
	}

	return latestList
}

func GetMaintainanceApps(c *space.Space) ([]*App, error) {
	useIndex := space.AppIndexName("maintenance")
	req := base.SprintfJSON(`{
  "use_index": %s,
  "selector": {"maintenance_activated": true},
  "limit": 1000
}`, useIndex)
	rows, err := c.AppsDB().Find(context.Background(), req)
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
