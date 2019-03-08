package registry

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/cozy/cozy-apps-registry/auth"
	"github.com/cozy/cozy-apps-registry/cache"
	"github.com/cozy/cozy-apps-registry/config"
	"github.com/cozy/cozy-apps-registry/consts"
	"github.com/cozy/cozy-apps-registry/errshttp"
	"github.com/cozy/cozy-apps-registry/magic"
	"github.com/spf13/viper"

	multierror "github.com/hashicorp/go-multierror"

	"github.com/cozy/echo"
	_ "github.com/go-kivik/couchdb" // for couchdb
	"github.com/go-kivik/couchdb/chttp"
	"github.com/go-kivik/kivik"
)

const maxApplicationSize = 20 * 1024 * 1024 // 20 Mo

var (
	validSlugReg    = regexp.MustCompile(`^[a-z0-9\-]*$`)
	validVersionReg = regexp.MustCompile(`^(0|[1-9][0-9]{0,4})\.(0|[1-9][0-9]{0,4})\.(0|[1-9][0-9]{0,4})(-dev\.[a-f0-9]{1,40}|-beta.(0|[1-9][0-9]{0,4}))?$`)
	validSpaceReg   = regexp.MustCompile(`^[a-z]+[a-z0-9\_\-]*$`)

	validAppTypes = []string{"webapp", "konnector"}
)

var (
	ErrAppAlreadyExists  = errshttp.NewError(http.StatusConflict, "Application already exists")
	ErrAppNotFound       = errshttp.NewError(http.StatusNotFound, "Application was not found")
	ErrAppSlugMismatch   = errshttp.NewError(http.StatusBadRequest, "Application slug does not match the one specified in the body")
	ErrAppSlugInvalid    = errshttp.NewError(http.StatusBadRequest, "Invalid application slug: should contain only lowercase alphanumeric characters and dashes")
	ErrAppEditorMismatch = errshttp.NewError(http.StatusBadRequest, "Application can not be updated: editor can not change")

	ErrVersionAlreadyExists = errshttp.NewError(http.StatusConflict, "Version already exists")
	ErrVersionSlugMismatch  = errshttp.NewError(http.StatusBadRequest, "Version slug does not match the application")
	ErrVersionNotFound      = errshttp.NewError(http.StatusNotFound, "Version was not found")
	ErrVersionInvalid       = errshttp.NewError(http.StatusBadRequest, "Invalid version value")
	ErrChannelInvalid       = errshttp.NewError(http.StatusBadRequest, `Invalid version channel: should be "stable", "beta" or "dev"`)
)

var versionClient = http.Client{
	Timeout: 30 * time.Second,
}

const (
	devSuffix  = "-dev."
	betaSuffix = "-beta."
)

const (
	appsDBSuffix        = "apps"
	versDBSuffix        = "versions"
	pendingVersDBSuffix = "pending"
	editorsDBSuffix     = "editors"
)

const (
	// "DUC" stands for DataUserCommitment
	DUCUserCiphered = "user_ciphered"
	DUCUserReserved = "user_reserved"
	DUCNone         = "none"

	// "DUCBy" stands for DataUserCommitmentBy
	DUCByCozy   = "cozy"
	DUCByEditor = "editor"
	DUCByNone   = "none"
)

var (
	validDUCValues   = []string{DUCUserCiphered, DUCUserReserved, DUCNone}
	validDUCByValues = []string{DUCByCozy, DUCByEditor, DUCByNone}
)

var (
	client    *kivik.Client
	clientURL *url.URL
	spaces    map[string]*Space

	globalPrefix    string
	globalEditorsDB *kivik.DB

	ctx = context.Background()

	appsIndexes = map[string][]string{
		"slug":        []string{"slug", "editor", "type"},
		"type":        []string{"type", "slug", "editor"},
		"editor":      []string{"editor", "slug", "type"},
		"created_at":  []string{"created_at", "slug", "editor", "type"},
		"maintenance": []string{"maintenance_activated"},
	}
)

func appIndexName(name string) string {
	return "apps-index-by-" + name + "-v2"
}

type Channel int
type Label int

const (
	Stable Channel = iota + 1
	Beta
	Dev
)

const (
	LabelA = iota
	LabelB
	LabelC
	LabelD
	LabelE
	LabelF
)

type Space struct {
	Prefix        string
	dbApps        *kivik.DB
	dbVers        *kivik.DB
	dbPendingVers *kivik.DB
}

func (c *Space) AppsDB() *kivik.DB {
	return c.dbApps
}

func (c *Space) VersDB() *kivik.DB {
	return c.dbVers
}

func (c *Space) PendingVersDB() *kivik.DB {
	return c.dbPendingVers
}

func (c *Space) dbName(suffix string) (name string) {
	if c.Prefix != "" {
		name = c.Prefix + "-"
	}
	name += suffix
	return dbName(name)
}

func dbName(name string) string {
	if globalPrefix != "" {
		return globalPrefix + "-" + name
	}
	return "registry-" + name
}

type AppOptions struct {
	Slug   string `json:"slug"`
	Editor string `json:"editor"`
	Type   string `json:"type"`

	DataUsageCommitment   *string `json:"data_usage_commitment"`
	DataUsageCommitmentBy *string `json:"data_usage_commitment_by"`
}

type App struct {
	ID  string `json:"_id,omitempty"`
	Rev string `json:"_rev,omitempty"`

	Slug      string    `json:"slug"`
	Type      string    `json:"type"`
	Editor    string    `json:"editor"`
	CreatedAt time.Time `json:"created_at"`

	MaintenanceActivated bool                `json:"maintenance_activated,omitempty"`
	MaintenanceOptions   *MaintenanceOptions `json:"maintenance_options,omitempty"`

	DataUsageCommitment   string `json:"data_usage_commitment"`
	DataUsageCommitmentBy string `json:"data_usage_commitment_by"`

	// Calculated fields, not present in the database
	Versions      *AppVersions `json:"versions,omitempty"`
	Label         Label        `json:"label"`
	LatestVersion *Version     `json:"latest_version,omitempty"`
}

type Locales map[string]interface{}

type MaintenanceOptions struct {
	FlagInfraMaintenance   bool                          `json:"flag_infra_maintenance"`
	FlagShortMaintenance   bool                          `json:"flag_short_maintenance"`
	FlagDisallowManualExec bool                          `json:"flag_disallow_manual_exec"`
	Messages               map[string]MaintenanceMessage `json:"messages"`
}

type MaintenanceMessage struct {
	LongMessage  string `json:"long_message"`
	ShortMessage string `json:"short_message"`
}

type AppVersions struct {
	HasVersions bool     `json:"has_versions"`
	Stable      []string `json:"stable,omitempty"`
	Beta        []string `json:"beta,omitempty"`
	Dev         []string `json:"dev,omitempty"`
}

type Developer struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

type Platform struct {
	Type string `json:"type"`
	URL  string `json:"url"`
}

type VersionOptions struct {
	Version     string          `json:"version"`
	URL         string          `json:"url"`
	Sha256      string          `json:"sha256"`
	Parameters  json.RawMessage `json:"parameters"`
	Icon        string          `json:"icon"`
	Partnership Partnership     `json:"partnership"`
	Screenshots []string        `json:"screenshots"`
}

type Version struct {
	ID          string                 `json:"_id,omitempty"`
	Rev         string                 `json:"_rev,omitempty"`
	Attachments map[string]interface{} `json:"_attachments,omitempty"`

	Slug      string          `json:"slug"`
	Editor    string          `json:"editor"`
	Type      string          `json:"type"`
	Version   string          `json:"version"`
	Manifest  json.RawMessage `json:"manifest"`
	CreatedAt time.Time       `json:"created_at"`
	URL       string          `json:"url"`
	Size      int64           `json:"size,string"`
	Sha256    string          `json:"sha256"`
	TarPrefix string          `json:"tar_prefix"`
}

type Partnership struct {
	Icon        string `json:"icon,omitempty"`
	Description string `json:"description,omitempty"`
}

// Manifest type contains a subset of the attributes contained in the manifest
// of applications. It is only here to help us reading some informations from
// the manifest that are useful to us, without manipulating maps.
type Manifest struct {
	Editor      string      `json:"editor"`
	Slug        string      `json:"slug"`
	Version     string      `json:"version"`
	Icon        string      `json:"icon"`
	Partnership Partnership `json:"partnership"`
	Screenshots []string    `json:"screenshots"`
	Locales     map[string]struct {
		Screenshots []string `json:"screenshots"`
	} `json:"locales"`
}

func NewSpace(prefix string) *Space {
	return &Space{Prefix: prefix}
}

func InitGlobalClient(addr, user, pass, prefix string) (editorsDB *kivik.DB, err error) {
	u, err := url.Parse(addr)
	if err != nil {
		return
	}
	u.User = nil

	client, err = kivik.New("couch", u.String())
	if err != nil {
		return
	}

	if user != "" {
		err = client.Authenticate(ctx, &chttp.BasicAuth{
			Username: user,
			Password: pass,
		})
		if err != nil {
			return
		}
	}

	clientURL = u
	clientURL.Path = ""
	clientURL.RawPath = ""

	globalPrefix = prefix

	editorsDBName := dbName(editorsDBSuffix)
	exists, err := client.DBExists(ctx, editorsDBName)
	if err != nil {
		return
	}
	if !exists {
		fmt.Printf("Creating database %q...", editorsDBName)
		db := client.CreateDB(ctx, editorsDBName)
		if err = db.Err(); err != nil {
			return
		}
		fmt.Println("ok.")
	}

	globalEditorsDB = client.DB(ctx, editorsDBName)
	if err = globalEditorsDB.Err(); err != nil {
		return
	}

	editorsDB = globalEditorsDB
	return
}

func RegisterSpace(name string) error {
	if spaces == nil {
		spaces = make(map[string]*Space)
	}
	name = strings.TrimSpace(name)
	if name == consts.DefaultSpacePrefix {
		name = ""
	} else {
		if !validSpaceReg.MatchString(name) {
			return fmt.Errorf("Space named %q contains invalid characters", name)
		}
	}
	if _, ok := spaces[name]; ok {
		return fmt.Errorf("Space %q already registered", name)
	}
	c := NewSpace(name)
	spaces[name] = c
	return c.init()
}

func GetSpacesNames() (cs []string) {
	cs = make([]string, 0, len(spaces))
	for n := range spaces {
		cs = append(cs, n)
	}
	return cs
}

func GetSpace(name string) (*Space, bool) {
	c, ok := spaces[name]
	return c, ok
}

func (c *Space) init() (err error) {
	for _, suffix := range []string{appsDBSuffix, versDBSuffix, pendingVersDBSuffix} {
		var ok bool
		dbName := c.dbName(suffix)
		ok, err = client.DBExists(ctx, dbName)
		if err != nil {
			return
		}
		if !ok {
			fmt.Printf("Creating database %q...", dbName)
			db := client.CreateDB(ctx, dbName)
			if err = db.Err(); err != nil {
				fmt.Println("failed")
				return err
			}
			fmt.Println("ok.")
		}
		var db *kivik.DB
		db = client.DB(context.Background(), dbName)
		if err = db.Err(); err != nil {
			return
		}
		switch suffix {
		case appsDBSuffix:
			c.dbApps = db
		case versDBSuffix:
			c.dbVers = db
		case pendingVersDBSuffix:
			c.dbPendingVers = db
		default:
			panic("unreachable")
		}
	}

	for name, fields := range appsIndexes {
		err = c.AppsDB().CreateIndex(ctx, appIndexName(name), appIndexName(name), echo.Map{"fields": fields})
		if err != nil {
			err = fmt.Errorf("Error while creating index %q: %s", appIndexName(name), err)
			return
		}
	}

	return
}

func IsValidApp(app *AppOptions) error {
	if app.Slug == "" || !validSlugReg.MatchString(app.Slug) {
		return ErrAppSlugInvalid
	}
	if app.Editor == "" {
		return errshttp.NewError(http.StatusBadRequest, "Invalid application: "+
			"the following `editor` field is empty")
	}
	if !stringInArray(app.Type, validAppTypes) {
		return errshttp.NewError(http.StatusBadRequest, "Invalid application: "+
			"got type %q, must be one of these: %s", app.Type, strings.Join(validAppTypes, ", "))
	}
	if app.DataUsageCommitment != nil && !stringInArray(*app.DataUsageCommitment, validDUCValues) {
		return errshttp.NewError(http.StatusBadRequest, "Invalid application: "+
			"got data_usage_commitment %q, must be one of these: %s", *app.DataUsageCommitment, strings.Join(validDUCValues, ", "))
	}
	if app.DataUsageCommitmentBy != nil && !stringInArray(*app.DataUsageCommitmentBy, validDUCByValues) {
		return errshttp.NewError(http.StatusBadRequest, "Invalid application: "+
			"got data_usage_commitment_by %q, must be one of these: %s", *app.DataUsageCommitmentBy, strings.Join(validDUCByValues, ", "))
	}
	return nil
}

func IsValidVersion(ver *VersionOptions) error {
	var fields []string
	if !validVersionReg.MatchString(ver.Version) {
		fields = append(fields, "version")
	}
	if ver.URL == "" {
		fields = append(fields, "url")
	} else if _, err := url.Parse(ver.URL); err != nil {
		fields = append(fields, "url")
	}
	if h, err := hex.DecodeString(ver.Sha256); err != nil || len(h) != 32 {
		fields = append(fields, "sha256")
	}
	if len(fields) > 0 {
		return fmt.Errorf("Invalid version: "+
			"the following fields are missing or erroneous: %s", strings.Join(fields, ", "))
	}
	return nil
}

func (av *AppVersions) GetAll() []string {
	res := []string{}
	res = append(res, av.Stable...)
	res = append(res, av.Beta...)
	res = append(res, av.Dev...)
	return res
}

func CreateApp(c *Space, opts *AppOptions, editor *auth.Editor) (*App, error) {
	if err := IsValidApp(opts); err != nil {
		return nil, err
	}

	_, err := findApp(c, opts.Slug)
	if err == nil {
		return nil, ErrAppAlreadyExists
	}
	if err != ErrAppNotFound {
		return nil, err
	}

	db := c.AppsDB()
	now := time.Now().UTC()
	app := new(App)
	app.ID = getAppID(opts.Slug)
	app.Rev = ""
	app.Slug = app.ID
	app.Type = opts.Type
	app.Editor = editor.Name()
	app.CreatedAt = now
	app.DataUsageCommitment, app.DataUsageCommitmentBy = defaultDataUserCommitment(app, opts)
	_, app.Rev, err = db.CreateDoc(ctx, app)
	if err != nil {
		return nil, err
	}
	app.Versions = &AppVersions{
		Stable: make([]string, 0),
		Beta:   make([]string, 0),
		Dev:    make([]string, 0),
	}
	app.Label = calculateAppLabel(app, nil)
	return app, nil
}

func ModifyApp(c *Space, appSlug string, opts AppOptions) (*App, error) {
	app, err := findApp(c, appSlug)
	if err != nil {
		return nil, err
	}
	if opts.DataUsageCommitment != nil {
		app.DataUsageCommitment = *opts.DataUsageCommitment
	}
	if opts.DataUsageCommitmentBy != nil {
		app.DataUsageCommitmentBy = *opts.DataUsageCommitmentBy
	}
	_, err = c.AppsDB().Put(ctx, app.ID, app)
	if err != nil {
		return nil, err
	}
	return app, nil
}

func ActivateMaintenanceApp(c *Space, appSlug string, opts MaintenanceOptions) error {
	app, err := findApp(c, appSlug)
	if err != nil {
		return err
	}
	if opts.Messages == nil {
		opts.Messages = make(map[string]MaintenanceMessage)
	}
	app.MaintenanceActivated = true
	app.MaintenanceOptions = &opts
	_, err = c.AppsDB().Put(ctx, app.ID, app)
	return err
}

func DeactivateMaintenanceApp(c *Space, appSlug string) error {
	app, err := findApp(c, appSlug)
	if err != nil {
		return err
	}
	app.MaintenanceActivated = false
	app.MaintenanceOptions = nil
	_, err = c.AppsDB().Put(ctx, app.ID, app)
	return err
}

func DownloadVersion(opts *VersionOptions) (*Version, []*kivik.Attachment, error) {
	return downloadVersion(opts)
}

func createVersion(c *Space, db *kivik.DB, ver *Version, attachments []*kivik.Attachment, app *App, ensureVersion bool) (err error) {
	if ver.Slug != app.Slug {
		return ErrVersionSlugMismatch
	}

	conf, err := config.GetConfig()
	if err != nil {
		return err
	}
	sc := conf.SwiftConnection

	if ensureVersion {
		_, err := FindVersion(c, ver.Slug, ver.Version)
		if err == nil {
			return ErrVersionAlreadyExists
		}
		if err != ErrVersionNotFound {
			return err
		}
	}

	ver.Slug = app.Slug
	ver.Type = app.Type
	ver.Editor = app.Editor

	_, ver.Rev, err = db.CreateDoc(ctx, ver)
	if err != nil {
		return err
	}

	versionChannel := GetVersionChannel(ver.Version)
	for _, channel := range []Channel{Stable, Beta, Dev} {
		if channel >= versionChannel {
			key := cache.Key(c.Prefix + "/" + ver.Slug + "/" + channelToStr(channel))
			cacheVersionsLatest := viper.Get("cacheVersionsLatest").(cache.Cache)
			cacheVersionsList := viper.Get("cacheVersionsList").(cache.Cache)
			cacheVersionsLatest.Remove(key)
			cacheVersionsList.Remove(key)
		}
	}

	// Storing the attachments to swift (screenshots, icon, partnership_icon)
	basePath := filepath.Join(ver.Slug, ver.Version)

	prefix := c.Prefix
	if prefix == "" {
		prefix = consts.DefaultSpacePrefix
	}

	for _, att := range attachments {
		f, err := sc.ObjectCreate(prefix, filepath.Join(basePath, att.Filename), false, "", att.ContentType, nil)
		if err != nil {
			return err
		}
		defer f.Close()
		_, err = io.Copy(f, att.Content)
		if err != nil {
			return err
		}
	}

	return nil
}

func CreatePendingVersion(c *Space, ver *Version, attachments []*kivik.Attachment, app *App) error {
	return createVersion(c, c.PendingVersDB(), ver, attachments, app, true)
}

func CreateReleaseVersion(c *Space, ver *Version, attachments []*kivik.Attachment, app *App, ensureVersion bool) (err error) {
	return createVersion(c, c.VersDB(), ver, attachments, app, ensureVersion)
}

func (version *Version) Clone() *Version {
	clone := *version
	clone.Attachments = make(map[string]interface{})
	for k, v := range version.Attachments {
		clone.Attachments[k] = v
	}
	return &clone
}

func ApprovePendingVersion(c *Space, pending *Version, app *App) (*Version, error) {
	db := c.PendingVersDB()

	release := pending.Clone()

	var attachments []*kivik.Attachment
	for filename := range release.Attachments {
		attachment, err := db.GetAttachment(ctx, pending.ID, filename)
		if err != nil {
			return nil, err
		}
		attachment.Filename = filename
		attachments = append(attachments, attachment)
	}

	release.Rev = ""
	release.Attachments = nil

	// We need to skip version check, because we don't drop pending
	// version until the end to avoid data loss in case of error
	err := CreateReleaseVersion(c, release, attachments, app, false)
	if err != nil {
		return nil, err
	}

	// Delete only at the end, to avoid data loss in case of error
	if _, err := db.Delete(ctx, pending.ID, pending.Rev); err != nil {
		return nil, err
	}

	return release, nil
}

func downloadRequest(url string, shasum string) (reader *bytes.Reader, contentType string, err error) {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		err = errshttp.NewError(http.StatusUnprocessableEntity,
			"Could not reach version on specified url %s: %s", url, err)
		return
	}

	resp, err := versionClient.Do(req)
	if err != nil {
		err = errshttp.NewError(http.StatusUnprocessableEntity,
			"Could not reach version on specified url %s: %s", url, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		err = errshttp.NewError(http.StatusUnprocessableEntity,
			"Could not reach version on specified url %s: server responded with code %d",
			url, resp.StatusCode)
		return
	}

	buf := new(bytes.Buffer)
	_, err = io.Copy(buf, io.LimitReader(resp.Body, maxApplicationSize))
	if err != nil {
		err = errshttp.NewError(http.StatusUnprocessableEntity,
			"Could not reach version on specified url %s: %s",
			url, err)
		return
	}

	h := sha256.New()
	h.Write(buf.Bytes())
	e, _ := hex.DecodeString(shasum)
	if !bytes.Equal(e, h.Sum(nil)) {
		err = errshttp.NewError(http.StatusUnprocessableEntity,
			"Checksum does not match the calculated one (expecting %q, got %q)", shasum, hex.EncodeToString(h.Sum(nil)))
		return
	}

	contentType = resp.Header.Get("content-type")
	return bytes.NewReader(buf.Bytes()), contentType, nil
}

func tarReader(reader io.Reader, contentType string) (*tar.Reader, error) {
	var err error
	switch contentType {
	case
		"application/gzip",
		"application/x-gzip",
		"application/x-tgz",
		"application/tar+gzip":
		reader, err = gzip.NewReader(reader)
		if err != nil {
			return nil, err
		}
	case "application/octet-stream":
		var r io.Reader
		if r, err = gzip.NewReader(reader); err == nil {
			reader = r
		}
	}
	return tar.NewReader(reader), nil
}

func downloadVersion(opts *VersionOptions) (ver *Version, attachments []*kivik.Attachment, err error) {
	url := opts.URL

	var buf *bytes.Reader
	var contentType string
	tryCount := 0
	for {
		tryCount++
		buf, contentType, err = downloadRequest(url, opts.Sha256)
		if err == nil {
			break
		} else if tryCount <= 3 {
			continue
		} else {
			return
		}
	}

	counter := &Counter{}
	var reader io.Reader = buf
	reader = io.TeeReader(reader, counter)

	var packVersion string
	var appType, tarPrefix string
	var manifestContent []byte
	hasPrefix := true

	tr, err := tarReader(reader, contentType)
	if err != nil {
		err = errshttp.NewError(http.StatusUnprocessableEntity,
			"Could not reach version on specified url %s: %s", url, err)
		return
	}
	for {
		var hdr *tar.Header
		hdr, err = tr.Next()
		if err == io.EOF {
			break
		}
		if err == io.ErrUnexpectedEOF {
			err = errshttp.NewError(http.StatusUnprocessableEntity,
				"Could not reach version on specified url %s: file is too big %s", url, err)
			return
		}
		if err != nil {
			err = errshttp.NewError(http.StatusUnprocessableEntity,
				"Could not reach version on specified url %s: %s", url, err)
			return
		}

		if hdr.Typeflag != tar.TypeReg {
			continue
		}

		fullname := path.Join("/", hdr.Name)
		basename := path.Base(fullname)
		dirname := path.Dir(fullname)
		if hasPrefix && dirname != "/" {
			rootDirname := path.Join("/", strings.SplitN(dirname, "/", 3)[1])
			if tarPrefix == "" {
				tarPrefix = rootDirname
			} else if tarPrefix != rootDirname {
				hasPrefix = false
			}
		} else {
			hasPrefix = false
		}

		if appType == "" &&
			(basename == "manifest.webapp" || basename == "manifest.konnector") {
			if basename == "manifest.webapp" {
				appType = "webapp"
			} else if basename == "manifest.konnector" {
				appType = "konnector"
			}
			manifestContent, err = ioutil.ReadAll(tr)
			if err != nil {
				err = errshttp.NewError(http.StatusUnprocessableEntity,
					"Could not reach version on specified url %s: %s", url, err)
				return
			}
		}

		if basename == "package.json" {
			var packageContent []byte
			packageContent, err = ioutil.ReadAll(tr)
			if err != nil {
				err = errshttp.NewError(http.StatusUnprocessableEntity,
					"Could not reach version on specified url %s: %s", url, err)
				return
			}
			var pack struct {
				Version string `json:"version"`
			}
			if err = json.Unmarshal(packageContent, &pack); err != nil {
				err = errshttp.NewError(http.StatusUnprocessableEntity,
					"File package.json is not valid in %s: %s", url, err)
				return
			}
			packVersion = pack.Version
		}
	}

	if !hasPrefix {
		tarPrefix = ""
	}

	if len(manifestContent) == 0 {
		err = errshttp.NewError(http.StatusUnprocessableEntity,
			"Application tarball does not contain a manifest")
		return
	}

	var manifest map[string]interface{}
	if err = json.Unmarshal(manifestContent, &manifest); err != nil {
		err = errshttp.NewError(http.StatusUnprocessableEntity,
			"Content of the manifest is not JSON valid: %s", err)
		return
	}

	var parsedManifest Manifest
	if err = json.Unmarshal(manifestContent, &parsedManifest); err != nil {
		err = errshttp.NewError(http.StatusUnprocessableEntity,
			"Content of the manifest is not JSON valid: %s", err)
		return
	}

	var errm error
	editorName := parsedManifest.Editor
	if editorName == "" {
		errm = multierror.Append(errm,
			fmt.Errorf("%q field is empty", "editor"))
	}

	slug := parsedManifest.Slug
	if slug == "" {
		errm = multierror.Append(errm,
			fmt.Errorf("%q field is empty", "slug"))
	}

	{
		var match bool
		version := parsedManifest.Version
		if version != "" {
			match = VersionMatch(opts.Version, version)
		}
		if !match {
			errm = multierror.Append(errm,
				fmt.Errorf("%q field does not match (%q != %q)",
					"version", version, opts.Version))
		}
		if packVersion != "" {
			match = VersionMatch(opts.Version, packVersion)
			if !match {
				errm = multierror.Append(errm,
					fmt.Errorf("\"version\" from package.json (%q != %q)",
						opts.Version, packVersion))
			}
		}
	}
	if errm != nil {
		err = errshttp.NewError(http.StatusUnprocessableEntity,
			"Content of the manifest does not match: %s", errm)
		return
	}

	{
		var iconPath string
		if opts.Icon != "" {
			iconPath = opts.Icon
		} else {
			iconPath = parsedManifest.Icon
		}
		if iconPath != "" {
			iconPath = path.Join("/", iconPath)
		}

		var partnershipIconPath string
		if opts.Partnership.Icon != "" {
			partnershipIconPath = opts.Partnership.Icon
		} else {
			partnershipIconPath = parsedManifest.Partnership.Icon
		}
		if partnershipIconPath != "" {
			partnershipIconPath = path.Join("/", partnershipIconPath)
		}

		var screenshotPaths []string
		if opts.Screenshots != nil {
			screenshotPaths = opts.Screenshots
			for i, shot := range screenshotPaths {
				screenshotPaths[i] = path.Join("/", shot)
			}
		} else {
			for _, shot := range parsedManifest.Screenshots {
				screenshotPaths = append(screenshotPaths, path.Join("/", shot))
			}
			for _, locale := range parsedManifest.Locales {
				for _, shot := range locale.Screenshots {
					shot = path.Join("/", shot)
					if !stringInArray(shot, screenshotPaths) {
						screenshotPaths = append(screenshotPaths, shot)
					}
				}
			}
		}

		if len(screenshotPaths) > 0 || iconPath != "" || partnershipIconPath != "" {
			buf.Seek(0, io.SeekStart)
			tr, err = tarReader(buf, contentType)
			if err != nil {
				err = errshttp.NewError(http.StatusUnprocessableEntity,
					"Could not reach version on specified url %s: %s", url, err)
				return
			}

			for {
				var hdr *tar.Header
				hdr, err = tr.Next()
				if err == io.EOF {
					err = nil
					break
				}
				if err == io.ErrUnexpectedEOF {
					err = errshttp.NewError(http.StatusUnprocessableEntity,
						"Could not reach version on specified url %s: file is too big %s", url, err)
					return
				}
				if err != nil {
					err = errshttp.NewError(http.StatusUnprocessableEntity,
						"Could not reach version on specified url %s: %s", url, err)
					return
				}

				if hdr.Typeflag != tar.TypeReg && hdr.Typeflag != tar.TypeDir {
					continue
				}

				name := path.Join("/", hdr.Name)
				if tarPrefix != "" {
					name = path.Join("/", strings.TrimPrefix(name, tarPrefix))
				}
				if name == "/" {
					continue
				}

				isIcon := iconPath != "" && name == iconPath
				isPartnershipIcon := partnershipIconPath != "" && name == partnershipIconPath

				isShot := !isIcon && stringInArray(name, screenshotPaths)
				if !isIcon && !isPartnershipIcon && !isShot {
					continue
				}

				var data []byte
				data, err = ioutil.ReadAll(tr)
				if err != nil {
					err = errshttp.NewError(http.StatusUnprocessableEntity,
						"Could not reach version on specified url %s: %s", url, err)
					return
				}
				var filename string
				if isIcon {
					filename = "icon"
				} else if isShot {
					filename = name
				} else if isPartnershipIcon {
					filename = "partnership_icon"
				} else {
					panic("unreachable")
				}
				mime := magic.MIMEType(name, data)
				body := ioutil.NopCloser(bytes.NewReader(data))
				attachments = append(attachments, &kivik.Attachment{
					Content:     body,
					Size:        int64(len(data)),
					Filename:    filename,
					ContentType: mime,
				})
			}
		}
	}

	if opts.Parameters != nil {
		manifest["parameters"] = opts.Parameters
		manifestContent, err = json.Marshal(manifest)
		if err != nil {
			return
		}
	}

	ver = new(Version)
	ver.ID = getVersionID(slug, opts.Version)
	ver.Slug = slug
	ver.Version = opts.Version
	ver.Type = appType
	ver.URL = opts.URL
	ver.Sha256 = opts.Sha256
	ver.Editor = editorName
	ver.Manifest = manifestContent
	ver.Size = counter.Written()
	ver.TarPrefix = tarPrefix
	ver.CreatedAt = time.Now().UTC()
	return
}

func VersionMatch(ver1, ver2 string) bool {
	v1 := SplitVersion(ver1)
	v2 := SplitVersion(ver2)
	return v1[0] == v2[0] && v1[1] == v2[1] && v1[2] == v2[2]
}

func GetVersionChannel(version string) Channel {
	if strings.Contains(version, devSuffix) {
		return Dev
	}
	if strings.Contains(version, betaSuffix) {
		return Beta
	}
	return Stable
}

func SplitVersion(version string) (v [3]string) {
	switch GetVersionChannel(version) {
	case Beta:
		version = version[:strings.Index(version, betaSuffix)]
	case Dev:
		version = version[:strings.Index(version, devSuffix)]
	}
	s := strings.SplitN(version, ".", 3)
	if len(s) == 3 {
		v[0] = s[0]
		v[1] = s[1]
		v[2] = s[2]
	}
	return
}

func calculateAppLabel(app *App, ver *Version) Label {
	hasRemoteDoctypes := false
	if ver != nil {
		var man struct {
			Permissions map[string]struct {
				Remote bool `json:"remote"`
			} `json:"permissions"`
		}
		err := json.Unmarshal(ver.Manifest, &man)
		if err == nil {
			for _, p := range man.Permissions {
				if p.Remote {
					hasRemoteDoctypes = true
					break
				}
			}
		}
	}

	duc, ducBy := app.DataUsageCommitment, app.DataUsageCommitmentBy
	switch {
	case !hasRemoteDoctypes && duc == DUCUserCiphered:
		return LabelA
	case !hasRemoteDoctypes && duc == DUCUserReserved:
		if ducBy == DUCByCozy {
			return LabelB
		} else if ducBy == DUCByEditor {
			return LabelC
		}
	case hasRemoteDoctypes && (duc == DUCUserCiphered || duc == DUCUserReserved):
		if ducBy == DUCByCozy {
			return LabelD
		} else if ducBy == DUCByEditor {
			return LabelE
		}
	}
	return LabelF
}

func defaultDataUserCommitment(app *App, opts *AppOptions) (duc, ducBy string) {
	if opts != nil {
		if opts.DataUsageCommitment != nil {
			duc = *opts.DataUsageCommitment
		}
		if opts.DataUsageCommitmentBy != nil {
			ducBy = *opts.DataUsageCommitmentBy
		}
	} else {
		duc, ducBy = app.DataUsageCommitment, app.DataUsageCommitmentBy
	}
	if duc == "" || ducBy == "" {
		if strings.ToLower(app.Editor) == "cozy" {
			duc, ducBy = DUCUserReserved, DUCByCozy
		} else {
			duc, ducBy = DUCNone, DUCByNone
		}
	}
	return
}

func StrToChannel(channel string) (Channel, error) {
	switch channel {
	case "stable":
		return Stable, nil
	case "beta":
		return Beta, nil
	case "dev":
		return Dev, nil
	default:
		return Stable, ErrChannelInvalid
	}
}

func channelToStr(channel Channel) string {
	switch channel {
	case Stable:
		return "stable"
	case Beta:
		return "beta"
	case Dev:
		return "dev"
	}
	panic("Unknown channel")
}
