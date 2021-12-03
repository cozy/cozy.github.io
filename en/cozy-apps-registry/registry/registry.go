package registry

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/cozy/cozy-apps-registry/asset"
	"github.com/cozy/cozy-apps-registry/auth"
	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/errshttp"
	"github.com/cozy/cozy-apps-registry/space"
	_ "github.com/go-kivik/couchdb/v3" // for couchdb
	"github.com/go-kivik/kivik/v3"
	"github.com/h2non/filetype"
	multierror "github.com/hashicorp/go-multierror"
	"github.com/sirupsen/logrus"
)

const maxApplicationSize = 20 * 1024 * 1024 // 20 Mo

var (
	validSlugReg    = regexp.MustCompile(`^[a-z0-9\-]*$`)
	validVersionReg = regexp.MustCompile(`^(0|[1-9][0-9]{0,4})\.(0|[1-9][0-9]{0,4})\.(0|[1-9][0-9]{0,4})(-dev\.[a-f0-9]{1,40}|-beta.(0|[1-9][0-9]{0,4}))?$`)

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
	SpacePrefix base.Prefix
	RegistryURL *url.URL
}

type Version struct {
	ID  string `json:"_id,omitempty"`
	Rev string `json:"_rev,omitempty"`

	AttachmentReferences map[string]string `json:"attachments"`
	Slug                 string            `json:"slug"`
	Editor               string            `json:"editor"`
	Type                 string            `json:"type"`
	Version              string            `json:"version"`
	Manifest             json.RawMessage   `json:"manifest"`
	CreatedAt            time.Time         `json:"created_at"`
	URL                  string            `json:"url"`
	Size                 int64             `json:"size,string"`
	Sha256               string            `json:"sha256"`
	TarPrefix            string            `json:"tar_prefix"`
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
	Name        string      `json:"name"`
	Slug        string      `json:"slug"`
	Version     string      `json:"version"`
	Icon        string      `json:"icon"`
	Partnership Partnership `json:"partnership"`
	Screenshots []string    `json:"screenshots"`
	Locales     map[string]struct {
		Screenshots []string `json:"screenshots"`
	} `json:"locales"`
}

// Tarball holds all the data from a downloaded app version
type Tarball struct {
	Manifest        *Manifest
	ManifestContent []byte
	ManifestMap     map[string]interface{}
	PackageVersion  string
	HasPrefix       bool
	TarPrefix       string
	ContentType     string
	AppType         string
	Content         []byte
	URL             string
	Size            int64
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

func CreateApp(c *space.Space, opts *AppOptions, editor *auth.Editor) (*App, error) {
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
	_, app.Rev, err = db.CreateDoc(context.Background(), app)
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

func ModifyApp(c *space.Space, appSlug string, opts AppOptions) (*App, error) {
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
	_, err = c.AppsDB().Put(context.Background(), app.ID, app)
	if err != nil {
		return nil, err
	}
	return app, nil
}

func ActivateMaintenanceApp(c *space.Space, appSlug string, opts MaintenanceOptions) error {
	app, err := findApp(c, appSlug)
	if err != nil {
		return err
	}
	if opts.Messages == nil {
		opts.Messages = make(map[string]MaintenanceMessage)
	}
	app.MaintenanceActivated = true
	app.MaintenanceOptions = &opts
	_, err = c.AppsDB().Put(context.Background(), app.ID, app)
	return err
}

func DeactivateMaintenanceApp(c *space.Space, appSlug string) error {
	app, err := findApp(c, appSlug)
	if err != nil {
		return err
	}
	app.MaintenanceActivated = false
	app.MaintenanceOptions = nil
	_, err = c.AppsDB().Put(context.Background(), app.ID, app)
	return err
}

func DownloadVersion(opts *VersionOptions) (*Version, []*kivik.Attachment, error) {
	return downloadVersion(opts)
}

func createVersion(c *space.Space, db *kivik.DB, ver *Version, attachments []*kivik.Attachment, app *App, ensureVersion bool) (err error) {
	if ver.Slug != app.Slug {
		return ErrVersionSlugMismatch
	}

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

	var verID string
	verID, ver.Rev, err = db.CreateDoc(context.Background(), ver)
	if err != nil {
		return err
	}

	versionChannel := GetVersionChannel(ver.Version)
	for _, channel := range Channels {
		if channel >= versionChannel {
			key := base.NewKey(c.Name, ver.Slug, ChannelToStr(channel))
			base.LatestVersionsCache.Remove(key)
			base.ListVersionsCache.Remove(key)
		}
	}

	// Storing the attachments to swift (screenshots, icon, partnership_icon)
	source := asset.ComputeSource(c.GetPrefix(), ver.Slug, ver.Version)
	atts := map[string]string{}
	for _, att := range attachments {
		// Adding asset to the global asset store
		a := &base.Asset{
			Name:        att.Filename,
			AppSlug:     app.Slug,
			ContentType: att.ContentType,
		}
		err = base.GlobalAssetStore.Add(a, att.Content, source)
		if err != nil {
			return err
		}

		// We are going to use the attachment field to store a link to the
		// global asset
		atts[att.Filename] = a.Shasum
	}

	// Update the version document to add an attachment that references global
	// database
	if len(atts) > 0 {
		ver.AttachmentReferences = atts
	}
	_, err = db.Put(context.Background(), verID, ver, nil)
	return err
}

func CreatePendingVersion(c *space.Space, ver *Version, attachments []*kivik.Attachment, app *App) error {
	return createVersion(c, c.PendingVersDB(), ver, attachments, app, true)
}

func CreateReleaseVersion(c *space.Space, ver *Version, attachments []*kivik.Attachment, app *App, ensureVersion bool) (err error) {
	if err := createVersion(c, c.VersDB(), ver, attachments, app, ensureVersion); err != nil {
		return err
	}

	for _, v := range base.Config.VirtualSpaces {
		source := v.Source
		if source == "__default__" {
			source = ""
		}
		if source == c.Name && v.AcceptApp(ver.Slug) {
			if err := RegenerateOverwrittenTarballs(v.Name, ver.Slug); err != nil {
				return err
			}
		}
	}
	return err
}

func (version *Version) Clone() *Version {
	clone := *version
	clone.AttachmentReferences = make(map[string]string)
	for k, v := range version.AttachmentReferences {
		clone.AttachmentReferences[k] = v
	}
	return &clone
}

func ApprovePendingVersion(c *space.Space, pending *Version, app *App) (*Version, error) {
	db := c.PendingVersDB()
	release := pending.Clone()
	release.Rev = ""

	// Attachments are already created, skipping them
	var attachments = []*kivik.Attachment{}

	// We need to skip version check, because we don't drop pending
	// version until the end to avoid data loss in case of error
	err := CreateReleaseVersion(c, release, attachments, app, false)
	if err != nil {
		return nil, err
	}

	// Delete only at the end, to avoid data loss in case of error
	if _, err := db.Delete(context.Background(), pending.ID, pending.Rev); err != nil {
		return nil, err
	}

	// Get version channel
	channel := GetVersionChannel(release.Version)

	channelString := ChannelToStr(channel)

	if base.Config.CleanEnabled {
		// Cleaning the old versions
		go func() {
			err := CleanOldVersions(c, release.Slug, channelString, base.Config.CleanParameters, RealRun)
			if err != nil {
				log := logrus.WithFields(logrus.Fields{
					"nspace":    "clean_version",
					"space":     c.Name,
					"slug":      release.Slug,
					"version":   release.Version,
					"channel":   channelString,
					"error_msg": err,
				})
				log.Error()
			}
		}()
	}

	return release, nil
}

func downloadRequest(rawURL string, shasum string) (reader *bytes.Reader, contentType string, err error) {
	url, err := url.Parse(rawURL)
	if err != nil {
		return nil, "", err
	}

	buf := new(bytes.Buffer)

	if url.Scheme == "file" {
		f, err := os.Open(url.EscapedPath())
		if err != nil {
			return nil, "", err
		}
		_, err = io.Copy(buf, io.LimitReader(f, maxApplicationSize))
		if err != nil {
			return nil, "", err
		}

		// Find the mimetype
		kind, _ := filetype.Match(buf.Bytes())
		contentType = kind.MIME.Value
	} else {
		req, err := http.NewRequest(http.MethodGet, rawURL, nil)
		if err != nil {
			err = errshttp.NewError(http.StatusUnprocessableEntity,
				"Could not reach version on specified url %s: %s", rawURL, err)
			return nil, "", err
		}

		resp, err := versionClient.Do(req)
		if err != nil {
			err = errshttp.NewError(http.StatusUnprocessableEntity,
				"Could not reach version on specified url %s: %s", rawURL, err)
			return nil, "", err
		}
		defer resp.Body.Close()

		if resp.StatusCode != 200 {
			err = errshttp.NewError(http.StatusUnprocessableEntity,
				"Could not reach version on specified url %s: server responded with code %d",
				rawURL, resp.StatusCode)
			return nil, "", err
		}

		_, err = io.Copy(buf, io.LimitReader(resp.Body, maxApplicationSize))
		if err != nil {
			err = errshttp.NewError(http.StatusUnprocessableEntity,
				"Could not reach version on specified url %s: %s",
				rawURL, err)
			return nil, "", err
		}

		contentType = resp.Header.Get("content-type")
	}
	h := sha256.New()
	if _, err = h.Write(buf.Bytes()); err != nil {
		return
	}
	e, _ := hex.DecodeString(shasum)
	if !bytes.Equal(e, h.Sum(nil)) {
		err = errshttp.NewError(http.StatusUnprocessableEntity,
			"Checksum does not match the calculated one (expecting %q, got %q)", shasum, hex.EncodeToString(h.Sum(nil)))
		return
	}

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

// CheckVersion controls the matching versions between retrieved tarball and
// options
func (t *Tarball) CheckVersion(expectedVersion string) (bool, error) {
	tbManifestVersion := t.Manifest.Version
	tbPackageVersion := t.PackageVersion

	var match bool
	var errm error

	if tbManifestVersion != "" {
		match = versionMatch(expectedVersion, tbManifestVersion)
	}
	if !match {
		errm = multierror.Append(errm,
			fmt.Errorf("%q field does not match (%q != %q)",
				"version", expectedVersion, tbManifestVersion))
	}

	if tbPackageVersion != "" {
		match = versionMatch(expectedVersion, tbPackageVersion)
		if !match {
			errm = multierror.Append(errm,
				fmt.Errorf("\"version\" from package.json (%q != %q)",
					expectedVersion, tbPackageVersion))
		}
	}

	if errm != nil {
		err := errshttp.NewError(http.StatusUnprocessableEntity,
			"Content of the manifest does not match: %s", errm)
		return false, err
	}

	return true, nil
}

// CheckEditor validates a tarball manifest editor
func (t *Tarball) CheckEditor() (bool, error) {
	editorName := t.Manifest.Editor

	if editorName == "" {
		return false, errors.New(`The "editor" field is empty`)
	}

	return true, nil
}

// CheckEditor validates a tarball manifest slug
func (t *Tarball) CheckSlug() (bool, error) {
	slug := t.Manifest.Slug

	if slug == "" {
		return false, errors.New(`The "slug" field is empty`)
	}

	return true, nil
}

func downloadTarball(opts *VersionOptions, url string) (*Tarball, error) {
	var buf *bytes.Reader
	var err error
	var contentType string

	// Downloading the file
	tryCount := 0
	for {
		tryCount++
		buf, contentType, err = downloadRequest(url, opts.Sha256)
		if err == nil {
			break
		} else if tryCount <= 3 {
			continue
		} else {
			return nil, err
		}
	}

	// Reader for filesize
	counter := &bytesCounter{}
	var reader io.Reader = buf
	reader = io.TeeReader(reader, counter)

	// Reading the tarball content
	tarball, err := ReadTarballVersion(reader, contentType, url)
	if err != nil {
		return nil, err
	}

	// Adding metadata to the tarball struct
	tarball.ContentType = contentType
	tarball.Size = counter.Written()

	if !tarball.HasPrefix {
		tarball.TarPrefix = ""
	}

	return tarball, nil
}

func downloadVersion(opts *VersionOptions) (*Version, []*kivik.Attachment, error) {
	var err *multierror.Error
	url := opts.URL

	tarball, errd := downloadTarball(opts, url)
	if errd != nil {
		return nil, nil, errd
	}

	// Checks
	if _, erre := tarball.CheckEditor(); erre != nil {
		err = multierror.Append(err, erre)
	}
	if _, errs := tarball.CheckSlug(); errs != nil {
		err = multierror.Append(err, errs)
	}
	if _, errv := tarball.CheckVersion(opts.Version); errv != nil {
		err = multierror.Append(err, errv)
	}

	// Handling tarball assets
	attachments, erra := HandleAssets(tarball, opts)
	if erra != nil {
		err = multierror.Append(err, erra)
	}

	// If there was any error during checks, we are not going further
	if err != nil {
		return nil, nil, err
	}

	manifestContent := tarball.ManifestContent
	manifest := tarball.ManifestMap

	// Adding custom parameters if needed
	var errm error
	if opts.Parameters != nil {
		manifest["parameters"] = opts.Parameters
		manifestContent, errm = json.Marshal(manifest)
		if errm != nil {
			return nil, nil, errm
		}
	}

	// Retreiving the tarball manifest
	parsedManifest := tarball.Manifest

	filename := filepath.Base(url)
	filepath := filepath.Join(parsedManifest.Slug, opts.Version, filename)

	// Saving app tarball
	errt := saveTarball(opts.SpacePrefix, filepath, tarball)
	if errt != nil {
		return nil, nil, errt
	}

	// Creating version
	ver := new(Version)
	ver.ID = getVersionID(parsedManifest.Slug, opts.Version)
	ver.Slug = parsedManifest.Slug
	ver.Version = opts.Version
	ver.Type = tarball.AppType
	// Now the tarball has been downloaded, override the original tarball URL to
	// local registry url for future downloads
	ver.URL = opts.RegistryURL.String()
	ver.Sha256 = opts.Sha256
	ver.Editor = parsedManifest.Editor
	ver.Manifest = manifestContent
	ver.Size = tarball.Size
	ver.TarPrefix = tarball.TarPrefix
	ver.CreatedAt = time.Now().UTC()
	return ver, attachments, nil
}

func getIconPath(parsedManifest *Manifest, opts *VersionOptions) string {
	var iconPath string
	if opts.Icon != "" {
		iconPath = opts.Icon
	} else {
		iconPath = parsedManifest.Icon
	}
	if iconPath != "" {
		iconPath = path.Join("/", iconPath)
	}
	return iconPath
}

func getPartnershipIconPath(parsedManifest *Manifest, opts *VersionOptions) string {
	var partnershipIconPath string
	if opts.Partnership.Icon != "" {
		partnershipIconPath = opts.Partnership.Icon
	} else {
		partnershipIconPath = parsedManifest.Partnership.Icon
	}
	if partnershipIconPath != "" {
		partnershipIconPath = path.Join("/", partnershipIconPath)
	}
	return partnershipIconPath
}

func getScreenshotPaths(parsedManifest *Manifest, opts *VersionOptions) []string {
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

	return screenshotPaths
}

// getAssetFilename computes the asset filename to write to the FS (icon,
// partnership_icon, screenshot, ...)
func getAssetFilename(iconPath, partnershipIconPath, name string, screenshotPaths []string) string {
	isIcon := iconPath != "" && name == iconPath
	isPartnershipIcon := partnershipIconPath != "" && name == partnershipIconPath

	isShot := !isIcon && stringInArray(name, screenshotPaths)
	if !isIcon && !isPartnershipIcon && !isShot {
		return ""
	}

	// Sets filename
	var filename string
	if isIcon {
		filename = "icon"
	} else if isShot {
		filename = path.Join("screenshots", name)
	} else if isPartnershipIcon {
		filename = "partnership_icon"
	} else {
		panic("unreachable")
	}

	return filename
}

// HandleAssets handles all the assets of the app tarball (icon, partnership
// icon, screenshots). Appened to attachments
func HandleAssets(tarball *Tarball, opts *VersionOptions) ([]*kivik.Attachment, error) {
	var attachments = []*kivik.Attachment{}
	parsedManifest := tarball.Manifest

	iconPath := getIconPath(parsedManifest, opts)
	partnershipIconPath := getPartnershipIconPath(parsedManifest, opts)
	screenshotPaths := getScreenshotPaths(parsedManifest, opts)

	// Re-reading tarball content for assets
	if len(screenshotPaths) == 0 && iconPath == "" && partnershipIconPath == "" {
		return attachments, nil
	}

	var buf io.Reader = bytes.NewReader(tarball.Content)
	tr, err := tarReader(buf, tarball.ContentType)
	if err != nil {
		err = errshttp.NewError(http.StatusUnprocessableEntity,
			"Could not reach version on specified url %s: %s", tarball.URL, err)
		return nil, err
	}

	for {
		var hdr *tar.Header
		hdr, err = tr.Next()
		if err == io.EOF {
			break
		}
		if err == io.ErrUnexpectedEOF {
			err = errshttp.NewError(http.StatusUnprocessableEntity,
				"Could not reach version on specified url %s: file is too big %s", tarball.URL, err)
			return nil, err
		}
		if err != nil {
			err = errshttp.NewError(http.StatusUnprocessableEntity,
				"Could not reach version on specified url %s: %s", tarball.URL, err)
			return nil, err
		}

		if hdr.Typeflag != tar.TypeReg && hdr.Typeflag != tar.TypeDir {
			continue
		}

		name := path.Join("/", hdr.Name)
		if tarball.TarPrefix != "" {
			name = path.Join("/", strings.TrimPrefix(name, tarball.TarPrefix))
		}
		if name == "/" {
			continue
		}

		filename := getAssetFilename(iconPath, partnershipIconPath, name, screenshotPaths)
		if filename == "" {
			continue
		}
		var data []byte
		data, err = ioutil.ReadAll(tr)
		if err != nil {
			return nil, err
		}

		mime := getMIMEType(name, data)
		body := ioutil.NopCloser(bytes.NewReader(data))
		attachments = append(attachments, &kivik.Attachment{
			Content:     body,
			Size:        int64(len(data)),
			Filename:    filename,
			ContentType: mime,
		})
	}

	return attachments, nil
}

func saveTarball(prefix base.Prefix, filepath string, tarball *Tarball) error {
	var content = bytes.NewReader(tarball.Content)
	return base.Storage.Create(prefix, filepath, tarball.ContentType, content)
}

// ReadTarballVersion reads the content of the version tarball which has been
// downloaded. It reads the tarball to check if an app prefix exists, ensure
// that the manifest and the package.json (if exists) files are correct, and
// eventually returns a Tarball struct that holds these informations for the
// next steps
func ReadTarballVersion(reader io.Reader, contentType, url string) (*Tarball, error) {
	var appType, tarPrefix string
	var packVersion string
	var manifestContent []byte
	var manifest *Manifest
	var manifestmap map[string]interface{}

	var content = new(bytes.Buffer)

	reader = io.TeeReader(reader, content)

	hasPrefix := true

	tr, err := tarReader(reader, contentType)
	if err != nil {
		err = errshttp.NewError(http.StatusUnprocessableEntity,
			"Cannot read tarball for url %s: %s", url, err)
		return nil, err
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
			return nil, err
		}
		if err != nil {
			err = errshttp.NewError(http.StatusUnprocessableEntity,
				"Could not reach version on specified url %s: %s", url, err)
			return nil, err
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
			manifest, manifestContent, manifestmap, err = ReadTarballManifest(tr, url)
			if err != nil {
				return nil, err
			}
		}

		if basename == "package.json" {
			var packageContent []byte
			packageContent, err = ioutil.ReadAll(tr)
			if err != nil {
				err = errshttp.NewError(http.StatusUnprocessableEntity,
					"Could not reach version on specified url %s: %s", url, err)
				return nil, err
			}
			var pack struct {
				Version string `json:"version"`
			}
			if err = json.Unmarshal(packageContent, &pack); err != nil {
				err = errshttp.NewError(http.StatusUnprocessableEntity,
					"File package.json is not valid in %s: %s", url, err)
				return nil, err
			}
			packVersion = pack.Version
		}
	}

	if manifest == nil {
		return nil, fmt.Errorf("Tarball does not contain a manifest")
	}

	return &Tarball{
		Manifest:        manifest,
		ManifestMap:     manifestmap,
		ManifestContent: manifestContent,
		AppType:         appType,
		PackageVersion:  packVersion,
		HasPrefix:       hasPrefix,
		TarPrefix:       tarPrefix,
		Content:         content.Bytes(),
		URL:             url,
	}, nil
}

// ReadTarballManifest handles the tarball manifest. It checks if the manifest
// exists, is valid JSON and tries to load it to the Manifest struct
func ReadTarballManifest(tr io.Reader, url string) (*Manifest, []byte, map[string]interface{}, error) {
	manifestContent, err := ioutil.ReadAll(tr)
	if err != nil {
		err = errshttp.NewError(http.StatusUnprocessableEntity,
			"Could not reach version on specified url %s: %s", url, err)
		return nil, nil, nil, err
	}

	if len(manifestContent) == 0 {
		err = errshttp.NewError(http.StatusUnprocessableEntity,
			"Application tarball does not contain a manifest")
		return nil, nil, nil, err
	}

	var manifest map[string]interface{}
	if err = json.Unmarshal(manifestContent, &manifest); err != nil {
		err = errshttp.NewError(http.StatusUnprocessableEntity,
			"Content of the manifest is not JSON valid: %s", err)
		return nil, nil, nil, err
	}

	var parsedManifest *Manifest
	if err = json.Unmarshal(manifestContent, &parsedManifest); err != nil {
		err = errshttp.NewError(http.StatusUnprocessableEntity,
			"Content of the manifest is not JSON valid: %s", err)
		return nil, nil, nil, err
	}

	return parsedManifest, manifestContent, manifest, nil
}

// Expire function deletes a version from the database
func (v *Version) Delete(c *space.Space) error {
	// Purge overwritten versions if any
	for _, vs := range base.Config.VirtualSpaces {
		if err := DeleteOverwrittenVersion(vs, v); err != nil {
			return err
		}
	}

	// Delete attachments (swift or couchdb)
	err := v.RemoveAllAttachments(c)
	if err != nil {
		return err
	}

	// Removing the CouchDB document
	db := c.VersDB()
	_, err = db.Delete(context.Background(), v.ID, v.Rev)

	// Clear cache
	versionChannel := GetVersionChannel(v.Version)
	for _, channel := range Channels {
		if channel >= versionChannel {
			key := base.NewKey(c.Name, v.Slug, ChannelToStr(channel))
			base.LatestVersionsCache.Remove(key)
			base.ListVersionsCache.Remove(key)
		}
	}

	return err
}

// RemoveAllAttachments removes all the attachments of a version
func (v *Version) RemoveAllAttachments(c *space.Space) error {
	prefix := c.GetPrefix()

	// Dereferences this version from global asset store
	if v.AttachmentReferences != nil {
		for _, shasum := range v.AttachmentReferences {
			source := asset.ComputeSource(prefix, v.Slug, v.Version)
			err := base.GlobalAssetStore.Remove(shasum, source)
			if err != nil {
				return err
			}
		}
	}

	// XXX: legacy
	fp := filepath.Join(v.Slug, v.Version)
	names, err := base.Storage.FindByPrefix(prefix, fp+"/")
	if err != nil {
		return err
	}
	for _, name := range names {
		if err := base.Storage.Remove(prefix, name); err != nil {
			return err
		}
	}

	return nil
}

func deleteAllVersionsOfAnApp(s *space.Space, app *App) error {
	// Skipping app with no versions
	if !app.Versions.HasVersions {
		return nil
	}

	for _, version := range app.Versions.GetAll() {
		v, err := FindVersion(s, app.Slug, version)
		if err != nil {
			fmt.Printf("Version not found: %s/%s\n", app.Slug, version)
			continue
		}
		fmt.Printf("Removing %s/%s\n", v.Slug, v.Version)
		err = v.Delete(s)
		if err != nil {
			return err
		}
	}

	return nil
}

// RemoveAppFromSpace deletes an application and all its versions from a space.
func RemoveAppFromSpace(s *space.Space, appSlug string) error {
	app, err := findApp(s, appSlug)
	if err != nil {
		return err
	}

	app.Versions, err = FindAppVersionsCacheMiss(s, appSlug, Dev, Concatenated)
	if err != nil {
		return err
	}

	if err := deleteAllVersionsOfAnApp(s, app); err != nil {
		return err
	}

	db := s.AppsDB()
	_, err = db.Delete(context.Background(), app.ID, app.Rev)
	return err
}

// RemoveSpace deletes CouchDB databases and Swift container for this space.
func RemoveSpace(s *space.Space) error {
	// Removing the applications versions, to clean the assets in the
	// __assets__ container.
	var cursor int = 0
	for cursor != -1 {
		next, apps, err := GetAppsList(nil, s, &AppsListOptions{
			Limit:                200,
			Cursor:               cursor,
			LatestVersionChannel: Stable,
			VersionsChannel:      Dev,
		})

		if err != nil {
			return err
		}
		cursor = next

		for _, app := range apps { // Iterate over 200 apps
			if err := deleteAllVersionsOfAnApp(s, app); err != nil {
				return err
			}
		}
	}

	// Removing swift container
	prefix := s.GetPrefix()
	if err := base.Storage.EnsureDeleted(prefix); err != nil {
		return err
	}

	// Removing databases
	if err := base.DBClient.DestroyDB(context.Background(), s.PendingVersDB().Name()); err != nil {
		return err
	}

	if err := base.DBClient.DestroyDB(context.Background(), s.VersDB().Name()); err != nil {
		return err
	}

	return base.DBClient.DestroyDB(context.Background(), s.AppsDB().Name())
}
