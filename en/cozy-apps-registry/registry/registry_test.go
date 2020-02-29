package registry

import (
	"archive/tar"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/cozy/cozy-apps-registry/asset"
	"github.com/cozy/cozy-apps-registry/auth"
	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/config"
	"github.com/go-kivik/kivik/v3"
	"github.com/spf13/viper"
	"github.com/stretchr/testify/assert"
)

const testSpaceName = "test-space"

var editor *auth.Editor
var app *App
var err error
var globalAssetStore *asset.GlobalAssetStore

func TestFindPreviousMinorExisting(t *testing.T) {
	ver := "1.2.0"
	versions := []string{"1.5.6", "0.0.1", "25.26.27", "1.1.3", "1.2.3", "1.1.2"}

	v, ok := findPreviousMinor(ver, versions)
	assert.True(t, ok)
	assert.Equal(t, "1.1.3", v)

	ver = "1.15.2"
	versions = []string{"1.5.6", "1.15.0", "25.26.27", "1.1.3", "1.2.3", "1.1.2"}

	v, ok = findPreviousMinor(ver, versions)
	assert.True(t, ok)
	assert.Equal(t, "1.15.0", v)
}

func TestFindPreviousMinorNotExisting(t *testing.T) {
	ver := "1.2.0"
	versions := []string{"1.5.6", "0.0.1", "25.26.27", "1.2.3"}

	v, ok := findPreviousMinor(ver, versions)
	assert.False(t, ok)
	assert.Empty(t, v)
}

func TestFindPreviousMajorExisting(t *testing.T) {
	ver := "2.2.0"
	versions := []string{"1.5.6", "0.0.1", "25.26.27", "1.2.3"}

	v, ok := findPreviousMajor(ver, versions)
	assert.True(t, ok)
	assert.Equal(t, "1.5.6", v)
}

func TestFindPreviousMajorNotExisting(t *testing.T) {
	ver := "1.2.0"
	versions := []string{"1.5.6", "25.26.27", "1.2.3"}

	v, ok := findPreviousMajor(ver, versions)
	assert.False(t, ok)
	assert.Empty(t, v)
}

func TestDownloadVersion(t *testing.T) {
	manifest := defaultManifest()
	tmpFile, shasum, err := generateTarball(&manifest, defaultPackage())
	assert.NoError(t, err)
	defer os.Remove(tmpFile)

	buildedURL := &url.URL{
		Scheme: "http",
		Host:   "foobar.com",
		Path:   "/registry/",
	}
	opts := &VersionOptions{
		URL:         "file://" + tmpFile,
		Sha256:      shasum,
		Version:     "1.0.0",
		RegistryURL: buildedURL,
		Space:       testSpaceName,
	}

	ver, att, err := DownloadVersion(opts)
	assert.NoError(t, err)
	assert.Empty(t, att)
	assert.Equal(t, "1.0.0", ver.Version)
}

func TestDownloadVersionWithoutEditor(t *testing.T) {
	// Generating a bad tarball with a missing editor in the manifest
	manifest := defaultManifest()
	manifest.Editor = ""

	tmpFile, shasum, err := generateTarball(&manifest, defaultPackage())
	assert.NoError(t, err)
	defer os.Remove(tmpFile)

	opts := &VersionOptions{
		URL:     "file://" + tmpFile,
		Sha256:  shasum,
		Version: "1.0.0",
	}

	_, _, err = DownloadVersion(opts)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "\"editor\" field is empty")
}

// Apps
func TestCreateApp(t *testing.T) {
	space, _ := GetSpace(testSpaceName)
	opts := &AppOptions{
		Editor: "cozy",
		Slug:   "app-test",
		Type:   "webapp",
	}

	app, err = CreateApp(space, opts, editor)
	assert.NoError(t, err)
}

func TestCreateAppBadType(t *testing.T) {
	space, _ := GetSpace(testSpaceName)
	opts := &AppOptions{
		Editor: "cozy",
		Slug:   "app-test",
		Type:   "foobar",
	}

	_, err := CreateApp(space, opts, editor)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "got type")
}

func TestDownloadVersionWithVersionsNotMatching(t *testing.T) {
	// Generating a tarball with not matching expected and downloaded
	// versions
	manifest := defaultManifest()
	tmpFile, shasum, err := generateTarball(&manifest, defaultPackage())
	assert.NoError(t, err)
	defer os.Remove(tmpFile)

	opts := &VersionOptions{
		URL:     "file://" + tmpFile,
		Sha256:  shasum,
		Version: "2.0.0",
	}

	_, _, err = DownloadVersion(opts)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "does not match")
}

func TestDownloadVersionBadURL(t *testing.T) {
	opts := &VersionOptions{
		URL:     "foobar",
		Sha256:  "aaa",
		Version: "2.0.0",
	}

	_, _, err := DownloadVersion(opts)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "version on specified url foobar")
}

func TestCreateVersion(t *testing.T) {
	s, _ := GetSpace(testSpaceName)
	db := s.VersDB()

	// Create the test app
	testApp, err := findApp(s, "app-test")
	assert.NoError(t, err)

	ver := new(Version)
	ver.Version = "1.0.0"
	ver.Slug = "app-test"
	ver.ID = getVersionID(ver.Slug, ver.Version)
	err = createVersion(s, db, ver, []*kivik.Attachment{}, testApp, true)
	assert.NoError(t, err)
}

func TestCreateVersionBadSlug(t *testing.T) {
	// Should fail because slugs are not matching
	s, _ := GetSpace(testSpaceName)
	db := s.VersDB()

	testApp, err := findApp(s, "app-test")
	assert.NoError(t, err)

	ver := new(Version)
	ver.Slug = "foobar"
	err = createVersion(s, db, ver, []*kivik.Attachment{}, testApp, true)
	assert.Error(t, err)
	assert.Equal(t, ErrVersionSlugMismatch, err)
}

func TestCreateVersionAlreadyExists(t *testing.T) {
	// Try to create the same version, should fail because the version already
	// exists
	s, _ := GetSpace(testSpaceName)
	db := s.VersDB()

	testApp, err := findApp(s, "app-test")
	assert.NoError(t, err)

	ver := new(Version)
	ver.Version = "1.0.0"
	ver.Slug = "app-test"
	err = createVersion(s, db, ver, []*kivik.Attachment{}, testApp, true)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "already exists")
}

func TestCreateVersionWithAttachment(t *testing.T) {
	// Create a Version with attachment and check it is created
	s, _ := GetSpace(testSpaceName)
	db := s.VersDB()

	testApp, err := findApp(s, "app-test")
	assert.NoError(t, err)

	ver := new(Version)
	ver.Version = "2.0.0"
	ver.Slug = "app-test"
	ver.ID = getVersionID(ver.Slug, ver.Version)
	att1Content := ioutil.NopCloser(strings.NewReader("this is the file content of attachment 1"))
	attachments := []*kivik.Attachment{{
		Filename:    "myfile1",
		ContentType: "text/plain",
		Content:     att1Content,
	}}

	err = createVersion(s, db, ver, attachments, testApp, true)
	assert.NoError(t, err)

	v, err := findVersion("app-test", "2.0.0", s.VersDB())
	assert.NoError(t, err)
	assert.NotNil(t, v.AttachmentReferences)

	sum := v.AttachmentReferences["myfile1"]
	assert.NotEmpty(t, sum)

	buf, headers, err := base.Storage.Get(asset.AssetContainerName, sum)
	assert.NoError(t, err)
	assert.NoError(t, err)
	assert.Equal(t, "text/plain", headers["Content-Type"])

	content := buf.String()
	assert.Equal(t, "this is the file content of attachment 1", content)
}

func TestActivateAppMaintenance(t *testing.T) {
	s, _ := GetSpace(testSpaceName)
	err := ActivateMaintenanceApp(s, "app-test", MaintenanceOptions{FlagInfraMaintenance: true})
	assert.NoError(t, err)

	app, err := findApp(s, "app-test")
	assert.NoError(t, err)
	assert.True(t, app.MaintenanceActivated)
}

func TestDeactivateAppMaintenance(t *testing.T) {
	s, _ := GetSpace(testSpaceName)
	err := DeactivateMaintenanceApp(s, "app-test")
	assert.NoError(t, err)

	app, err := findApp(s, "app-test")
	assert.NoError(t, err)
	assert.False(t, app.MaintenanceActivated)
}

// Finders
func TestFindApp(t *testing.T) {
	s, _ := GetSpace(testSpaceName)
	app, err := FindApp(s, "app-test", Stable)
	assert.NoError(t, err)
	assert.Equal(t, app.LatestVersion.Version, "2.0.0")
}

func TestFindAppAttachment(t *testing.T) {
	s, _ := GetSpace(testSpaceName)
	att, err := FindAppAttachment(s, "app-test", "myfile1", Stable)
	assert.NoError(t, err)
	assert.Equal(t, "text/plain", att.ContentType)

	content, err := ioutil.ReadAll(att.Content)
	assert.NoError(t, err)
	assert.Equal(t, "this is the file content of attachment 1", string(content))
}

func TestGetAppsList(t *testing.T) {
	s, _ := GetSpace(testSpaceName)
	opts := &AppOptions{
		Editor: "cozy",
		Slug:   "app-test2",
		Type:   "konnector",
	}

	app, err = CreateApp(s, opts, editor)
	assert.NoError(t, err)

	cursor, apps, err := GetAppsList(s, &AppsListOptions{
		Limit:                10,
		LatestVersionChannel: Stable,
		VersionsChannel:      Dev,
	})
	assert.NoError(t, err)
	assert.Equal(t, -1, cursor) // No error if the cursor == -1
	assert.Equal(t, 2, len(apps))
}

func TestGetAppsListSelectFilter(t *testing.T) {
	s, _ := GetSpace(testSpaceName)

	_, apps, err := GetAppsList(s, &AppsListOptions{
		Limit:                10,
		LatestVersionChannel: Stable,
		VersionsChannel:      Dev,
		Filters:              map[string]string{"select": "app-test"},
	})
	assert.NoError(t, err)
	assert.Equal(t, 1, len(apps))
	assert.Equal(t, "app-test", apps[0].Slug)
}

func TestGetAppsListRejectFilter(t *testing.T) {
	s, _ := GetSpace(testSpaceName)

	_, apps, err := GetAppsList(s, &AppsListOptions{
		Limit:                10,
		LatestVersionChannel: Stable,
		VersionsChannel:      Dev,
		Filters:              map[string]string{"reject": "app-test"},
	})
	assert.NoError(t, err)
	assert.Equal(t, 1, len(apps))
	assert.Equal(t, "app-test2", apps[0].Slug)
}

func TestLastNVersions(t *testing.T) {
	s, _ := GetSpace(testSpaceName)

	// We want to get the last major version (1.0.0)
	versions, err := FindLastNVersions(s, "app-test", "stable", 1, 2)
	assert.NoError(t, err)
	assert.Equal(t, 1, len(versions))
	assert.Equal(t, "2.0.0", versions[0].Version)

	// We want to get the lasts two major versions (1.0.0 & 2.0.0)
	versions, err = FindLastNVersions(s, "app-test", "stable", 2, 1)
	assert.NoError(t, err)
	assert.Equal(t, 2, len(versions))
	assert.Equal(t, "2.0.0", versions[0].Version)
	assert.Equal(t, "1.0.0", versions[1].Version)

	versions, err = FindLastNVersions(s, "app-test", "stable", 2, 2)
	assert.NoError(t, err)
	assert.Equal(t, 2, len(versions))
	assert.Equal(t, "2.0.0", versions[0].Version)
	assert.Equal(t, "1.0.0", versions[1].Version)

	// Create new minors versions
	db := s.VersDB()
	app, err := FindApp(s, "app-test", Stable)
	assert.NoError(t, err)

	ver := new(Version)
	ver.Version = "1.0.1"
	ver.Slug = "app-test"
	ver.ID = getVersionID(ver.Slug, ver.Version)
	err = createVersion(s, db, ver, []*kivik.Attachment{}, app, true)
	assert.NoError(t, err)

	ver = new(Version)
	ver.Version = "2.3.0"
	ver.Slug = "app-test"
	ver.ID = getVersionID(ver.Slug, ver.Version)
	err = createVersion(s, db, ver, []*kivik.Attachment{}, app, true)
	assert.NoError(t, err)

	versions, err = FindLastNVersions(s, "app-test", "stable", 2, 2)
	assert.NoError(t, err)
	assert.Equal(t, 4, len(versions))
	assert.Equal(t, "2.3.0", versions[0].Version)
	assert.Equal(t, "2.0.0", versions[1].Version)
	assert.Equal(t, "1.0.1", versions[2].Version)
	assert.Equal(t, "1.0.0", versions[3].Version)

	versions, err = FindLastNVersions(s, "app-test", "stable", 1, 2)
	assert.NoError(t, err)
	assert.Equal(t, 2, len(versions))
	assert.Equal(t, "2.3.0", versions[0].Version)
	assert.Equal(t, "2.0.0", versions[1].Version)
}

func TestFindLastsVersionsSince(t *testing.T) {
	s, _ := GetSpace(testSpaceName)
	db := s.VersDB()
	app, err := FindApp(s, "app-test", Stable)
	assert.NoError(t, err)

	ver := new(Version)
	ver.Version = "3.0.0"
	ver.Slug = "app-test"
	// This version was created yersterday
	ver.CreatedAt = time.Now().AddDate(0, 0, -1)
	ver.ID = getVersionID(ver.Slug, ver.Version)
	err = createVersion(s, db, ver, []*kivik.Attachment{}, app, true)
	assert.NoError(t, err)

	// Find the versions since last month
	lastMonth := time.Now().AddDate(0, -1, 0)
	vers, err := FindLastsVersionsSince(s, "app-test", "stable", lastMonth)
	assert.NoError(t, err)
	assert.Equal(t, 1, len(vers))
	assert.Equal(t, "3.0.0", vers[0].Version)
}

func TestDeleteVersion(t *testing.T) {
	s, _ := GetSpace(testSpaceName)
	// Version 2.0.0 is the only to have an attachment
	ver, err := findVersion("app-test", "2.0.0", s.VersDB())
	assert.NoError(t, err)
	assert.NotNil(t, ver)

	// Check the file is still here
	_, _, err = base.Storage.Get(asset.AssetContainerName, ver.AttachmentReferences["myfile1"])
	assert.NoError(t, err)

	// Delete the version and try to get the (normally) deleted object
	err = ver.Delete(s)
	assert.NoError(t, err)
	_, _, err = base.Storage.Get(asset.AssetContainerName, ver.AttachmentReferences["myfile1"])
	assert.True(t, errors.Is(err, base.ErrFileNotFound))
}

// Download version

func TestDownloadVersioNoManifest(t *testing.T) {
	missingManifestFile, _ := ioutil.TempFile(os.TempDir(), "cozy-registry-test")
	tarWriter := tar.NewWriter(missingManifestFile)
	defer func() {
		tarWriter.Close()
		missingManifestFile.Close()
		os.Remove(missingManifestFile.Name())
	}()
	packageContent, err := json.Marshal(defaultPackage())
	assert.NoError(t, err)
	packageHeaders := &tar.Header{
		Name: "package.json",
		Size: int64(len(packageContent)),
		Mode: 777,
	}

	err = tarWriter.WriteHeader(packageHeaders)
	assert.NoError(t, err)
	_, err = tarWriter.Write(packageContent)
	assert.NoError(t, err)
	tarWriter.Flush()

	h := sha256.New()
	fileContent, _ := ioutil.ReadFile(missingManifestFile.Name())
	_, err = h.Write(fileContent)
	assert.NoError(t, err)

	// Generating a bad tarball with a missing editor in the manifest
	opts := &VersionOptions{
		URL:     "file://" + missingManifestFile.Name(),
		Sha256:  hex.EncodeToString(h.Sum(nil)),
		Version: "2.0.0",
	}

	_, _, err = DownloadVersion(opts)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "does not contain a manifest")
}

func TestIsValidVersion(t *testing.T) {
	ver := &VersionOptions{
		Version: "1.0.0",
		URL:     "http://foobar.com",
		Sha256:  "D5AFEAF17396050E17C40E640DBD26DD2B103B5FBC1BB97D3306ED6254322481",
	}
	assert.NoError(t, IsValidVersion(ver))
}

func TestIsValidVersionBadVersion(t *testing.T) {
	ver := &VersionOptions{
		Version: "abc",
		URL:     "",
		Sha256:  "azerty",
	}
	res := IsValidVersion(ver)
	assert.Error(t, res)
	assert.Contains(t, res.Error(), "version", "sha256", "url")
}

func TestRemoveSpace(t *testing.T) {
	s, _ := GetSpace(testSpaceName)
	err := RemoveSpace(s)
	assert.NoError(t, err)

	// Assert no container
	// FIXME
	// conf := config.GetConfig()
	// sc := conf.SwiftConnection
	// _, _, err = sc.Container(s.Prefix)
	// assert.Equal(t, swift.ContainerNotFound, err)

	// Assert no databases
	client := s.AppsDB().Client()
	ok, err := client.DBExists(ctx, s.AppsDB().Name())
	assert.NoError(t, err)
	assert.False(t, ok)

	ok, err = client.DBExists(ctx, s.PendingVersDB().Name())
	assert.NoError(t, err)
	assert.False(t, ok)

	ok, err = client.DBExists(ctx, s.VersDB().Name())
	assert.NoError(t, err)
	assert.False(t, ok)
}

func TestMain(m *testing.M) {
	config.SetDefaults()
	if err := config.ReadFile("", "cozy-registry-test"); err != nil {
		fmt.Println("Cannot load test config:", err)
	}

	// TODO remove those lines
	viper.Set("swift.username", "swifttest")
	viper.Set("swift.api_key", "swifttest")
	viper.Set("swift.auth_url", "localhost:12345")

	if err := config.SetupForTests(); err != nil {
		fmt.Println("Cannot configure the services:", err)
		os.Exit(1)
	}

	// Ensure kivik is launched
	url := viper.GetString("couchdb.url")
	user := viper.GetString("couchdb.user")
	pass := viper.GetString("couchdb.password")
	editorsDB, err := InitGlobalClient(url, user, pass)
	if err != nil {
		fmt.Println("Error accessing CouchDB:", err)
	}

	// Preparing test space
	if err := RegisterSpace(testSpaceName); err != nil {
		fmt.Println("Error registering space:", err)
	}

	s, ok := GetSpace(testSpaceName)
	if ok {
		db := s.VersDB()
		if err := CreateVersionsDateView(db); err != nil {
			fmt.Println("Error creating views:", err)
		}
	}

	// Creating a default editor
	vault := auth.NewCouchDBVault(editorsDB)
	auth.Editors = auth.NewEditorRegistry(vault)
	editor, err = auth.Editors.CreateEditorWithoutPublicKey("cozytesteditor", true)
	if err != nil {
		fmt.Println("Error while creating editor:", err)
	}

	// Global asset store
	globalAssetStore, err = asset.InitGlobalAssetStore(url, user, pass)
	if err != nil {
		fmt.Printf("Could not reach CouchDB: %s", err)
	}

	if err := config.PrepareSpaces(); err != nil {
		fmt.Println("Cannot prepare the spaces:", err)
		os.Exit(1)
	}

	out := m.Run()

	// Databases cleaning
	appDB := s.AppsDB()
	client := appDB.Client()

	err = client.DestroyDB(ctx, appDB.Name())
	if err != nil {
		fmt.Println("Cannot remove test app DB")
	}
	err = client.DestroyDB(ctx, s.PendingVersDB().Name())
	if err != nil {
		fmt.Println("Cannot remove test pending version DB")
	}
	err = client.DestroyDB(ctx, s.VersDB().Name())
	if err != nil {
		fmt.Println("Cannot remove test version DB")
	}

	type editor struct {
		ID  string `json:"_id,omitempty"`
		Rev string `json:"_rev,omitempty"`
	}
	row := editorsDB.Get(ctx, "cozytesteditor")
	var doc editor
	err = row.ScanDoc(&doc)
	if err != nil {
		fmt.Println("Cannot remove test editor ")
	}
	_, err = editorsDB.Delete(ctx, doc.ID, doc.Rev)
	if err != nil {
		fmt.Println("Cannot remove test editor DB")
	}

	os.Exit(out)
}

// Helpers
//
func generatePackageJSON(tw *tar.Writer, content map[string]interface{}) error {
	packageContent, _ := json.Marshal(content)
	packageHeaders := &tar.Header{
		Name: "package.json",
		Size: int64(len(packageContent)),
		Mode: 777,
	}

	err := tw.WriteHeader(packageHeaders)
	if err != nil {
		return err
	}
	_, err = tw.Write(packageContent)
	if err != nil {
		return err
	}
	tw.Flush()
	return nil
}

func generateManifestJSON(tw *tar.Writer, manifest *Manifest) error {
	manifestContent, _ := json.Marshal(manifest)
	manifestHeaders := &tar.Header{
		Name: "manifest.webapp",
		Size: int64(len(manifestContent)),
		Mode: 777,
	}

	err := tw.WriteHeader(manifestHeaders)
	if err != nil {
		return err
	}
	_, err = tw.Write(manifestContent)
	if err != nil {
		return err
	}
	tw.Flush()
	return nil
}

func generateTarball(manifestContent *Manifest, packageContent map[string]interface{}) (string, string, error) {
	var err error
	// Creating a test tarball
	tmpFile, _ := ioutil.TempFile(os.TempDir(), "cozy-registry-test")
	tarWriter := tar.NewWriter(tmpFile)
	defer tarWriter.Close()

	err = generatePackageJSON(tarWriter, packageContent)
	if err != nil {
		return "", "", err
	}
	err = generateManifestJSON(tarWriter, manifestContent)
	if err != nil {
		return "", "", err
	}

	tmpFile.Close()

	// Computes the SHA256 sum of the tarball
	h := sha256.New()
	filename := tmpFile.Name()
	fileContent, _ := ioutil.ReadFile(filename)
	_, err = h.Write(fileContent)
	if err != nil {
		return "", "", err
	}

	return filename, hex.EncodeToString(h.Sum(nil)), nil
}

// Return a simple validated manifest
func defaultManifest() Manifest {
	return Manifest{
		Slug:    "cozy-test-app",
		Editor:  "cozy-test-editor",
		Version: "1.0.0",
	}
}

// Return a simple validated package
func defaultPackage() map[string]interface{} {
	return map[string]interface{}{
		"version": "1.0.0",
	}
}
