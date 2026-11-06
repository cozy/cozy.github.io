package web

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"testing"

	"github.com/go-kivik/kivik/v3"

	"github.com/cozy/cozy-apps-registry/auth"
	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/config"
	"github.com/cozy/cozy-apps-registry/errshttp"
	"github.com/cozy/cozy-apps-registry/registry"
	"github.com/cozy/cozy-apps-registry/space"
	"github.com/labstack/echo/v4"
	"github.com/spf13/viper"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	allAppsSpace   = "all-apps"
	myAppsSpace    = "my-apps"
	keptApp        = "kept"
	rejectedApp    = "rejected"
	overwrittenApp = "overwritten" // its name and icon are overwritten
)

const (
	allKonnectorsSpace = "all-konnectors"
	myKonnectorsSpace  = "my-konnectors"
	fooKonn            = "foo"    // foo is rejected from the virtual space
	barKonn            = "bar"    // bar is not in maintenance
	bazKonn            = "baz"    // baz is not in maintenance, but its maintenance status is overwritten in my-konnectors
	quxKonn            = "qux"    // qux is in maintenance, but is maintenance status is overwritten in my-konnectors to a new message
	quuxKonn           = "quux"   // quux is in maintenance in the normal space, but not in the virtual space
	courgeKonn         = "courge" // courge is in maintenance
)

var server *httptest.Server

func TestListAppsFromVirtualSpace(t *testing.T) {
	u := fmt.Sprintf("%s/%s/registry/", server.URL, myAppsSpace)
	res, err := http.Get(u)
	assert.NoError(t, err)
	assert.Equal(t, 200, res.StatusCode)
	defer res.Body.Close()
	var body map[string]interface{}
	err = json.NewDecoder(res.Body).Decode(&body)
	assert.NoError(t, err)
	meta, ok := body["meta"].(map[string]interface{})
	assert.True(t, ok)
	assert.EqualValues(t, 2, meta["count"])
	assert.NotContains(t, meta, "next_cursor")
	data, ok := body["data"].([]interface{})
	assert.True(t, ok)

	var kept, over map[string]interface{}
	one := data[0].(map[string]interface{})
	two := data[1].(map[string]interface{})
	if one["slug"] == keptApp {
		kept = one
		over = two
	} else {
		over = one
		kept = two
	}
	assert.Equal(t, keptApp, kept["slug"])
	assert.Equal(t, overwrittenApp, over["slug"])
}

func TestListKonnsFromVirtualSpace(t *testing.T) {
	konns := map[string]map[string]interface{}{} // slug -> data entry for the konnector
	cursor := ""

	for i := 0; i < 2; i++ {
		u := fmt.Sprintf("%s/%s/registry/?limit=4", server.URL, myKonnectorsSpace)
		if cursor != "" {
			u = fmt.Sprintf("%s&cursor=%s", u, cursor)
		}
		res, err := http.Get(u)
		assert.NoError(t, err)
		assert.Equal(t, 200, res.StatusCode)
		defer res.Body.Close()
		var body map[string]interface{}
		err = json.NewDecoder(res.Body).Decode(&body)
		assert.NoError(t, err)
		meta, ok := body["meta"].(map[string]interface{})
		assert.True(t, ok)
		if i == 0 {
			assert.EqualValues(t, 4, meta["count"])
			cursor, ok = meta["next_cursor"].(string)
			assert.True(t, ok)
		} else {
			assert.EqualValues(t, 1, meta["count"])
			assert.NotContains(t, meta, "next_cursor")
		}
		data, ok := body["data"].([]interface{})
		assert.True(t, ok)

		for _, entry := range data {
			konn, ok := entry.(map[string]interface{})
			assert.True(t, ok)
			slug, ok := konn["slug"].(string)
			assert.True(t, ok)
			konns[slug] = konn
		}
	}

	assert.NotContains(t, konns, fooKonn)
	assert.Contains(t, konns, barKonn)
	assert.Contains(t, konns, bazKonn)
	assert.Contains(t, konns, quxKonn)
	assert.Contains(t, konns, quuxKonn)
	assert.Contains(t, konns, courgeKonn)
}

func TestAppIconFromVirtualSpace(t *testing.T) {
	expected, err := os.ReadFile("../scripts/drive-icon.svg")
	assert.NoError(t, err)
	u := fmt.Sprintf("%s/%s/registry/%s/icon", server.URL, myAppsSpace, overwrittenApp)
	res, err := http.Get(u)
	assert.NoError(t, err)
	assert.Equal(t, 200, res.StatusCode)
	defer res.Body.Close()
	body, err := io.ReadAll(res.Body)
	assert.NoError(t, err)
	assert.Equal(t, expected, body)
}

func TestVersionIconFromVirtualSpace(t *testing.T) {
	expected, err := os.ReadFile("../scripts/drive-icon.svg")
	assert.NoError(t, err)
	u := fmt.Sprintf("%s/%s/registry/%s/1.2.3/icon", server.URL, myAppsSpace, overwrittenApp)
	res, err := http.Get(u)
	assert.NoError(t, err)
	assert.Equal(t, 200, res.StatusCode)
	defer res.Body.Close()
	body, err := io.ReadAll(res.Body)
	assert.NoError(t, err)
	assert.Equal(t, expected, body)
}

func TestMain(m *testing.M) {
	config.SetDefaults()
	viper.Set("spaces", []string{"__default__", allAppsSpace, allKonnectorsSpace})
	// The universal link endpoint resolves the space from the request host.
	viper.Set("domain_space", map[string]string{
		universalLinkHost: allAppsSpace,
	})
	viper.Set("virtual_spaces", map[string]interface{}{
		myAppsSpace: map[string]interface{}{
			"source": allAppsSpace,
			"filter": "select",
			"slugs":  []interface{}{overwrittenApp, keptApp},
		},
		myKonnectorsSpace: map[string]interface{}{
			"source": allKonnectorsSpace,
			"filter": "reject",
			"slugs":  []interface{}{fooKonn},
		},
	})

	if err := config.ReadFile("", "cozy-registry-test"); err != nil {
		fmt.Println("Cannot load test config:", err)
	}

	if err := config.SetupForTests(); err != nil {
		fmt.Println("Cannot configure the services:", err)
		os.Exit(1)
	}

	if err := config.PrepareSpaces(true); err != nil {
		fmt.Println("Cannot prepare the spaces:", err)
		os.Exit(1)
	}

	if err := createApps(); err != nil {
		fmt.Println("Cannot create apps:", err)
		os.Exit(1)
	}

	router := Router()
	server = httptest.NewServer(router)

	out := m.Run()

	server.Close()

	if err := config.CleanupTests(); err != nil {
		fmt.Println("Error while cleaning:", err)
	}

	os.Exit(out)
}

func createApps() error {
	editor := auth.NewEditorForTest("cozy")

	s, _ := space.GetSpace(allAppsSpace)
	apps := []string{keptApp, rejectedApp, overwrittenApp}
	for _, app := range apps {
		opts := &registry.AppOptions{
			Editor: "cozy",
			Slug:   app,
			Type:   "webapp",
		}
		if _, err := registry.CreateApp(s, opts, editor); err != nil {
			return err
		}
	}

	app, err := registry.FindApp(nil, s, overwrittenApp, registry.Stable)
	if err != nil {
		return err
	}

	tarball, err := os.Open("../scripts/dummy.tar.gz")
	if err != nil {
		return err
	}
	defer tarball.Close()
	stats, err := tarball.Stat()
	if err != nil {
		return err
	}
	attachments := []*kivik.Attachment{
		{
			Filename:    "dummy.tar.gz",
			ContentType: "application/gzip",
			Size:        stats.Size(),
			Content:     tarball,
		},
	}
	version := &registry.Version{
		ID:      overwrittenApp + "-1.2.3",
		Slug:    overwrittenApp,
		Version: "1.2.3",
		URL:     "http://example.org/registry/dummy.tar.gz",
	}
	if err = registry.CreateReleaseVersion(s, version, attachments, app, false); err != nil {
		return err
	}

	if err := registry.OverwriteAppName(myAppsSpace, overwrittenApp, "my new name"); err != nil {
		return err
	}
	if err := registry.OverwriteAppIcon(myAppsSpace, overwrittenApp, "../scripts/drive-icon.svg"); err != nil {
		return err
	}

	s, _ = space.GetSpace(allKonnectorsSpace)
	konns := []string{fooKonn, barKonn, bazKonn, quxKonn, quuxKonn, courgeKonn}
	for _, konn := range konns {
		opts := &registry.AppOptions{
			Editor: "cozy",
			Slug:   konn,
			Type:   "konnector",
		}
		if _, err := registry.CreateApp(s, opts, editor); err != nil {
			return err
		}
	}

	inMaintenance := []string{quxKonn, quuxKonn, courgeKonn}
	for _, konn := range inMaintenance {
		opts := registry.MaintenanceOptions{
			Messages: map[string]registry.MaintenanceMessage{
				"en": {
					ShortMessage: fmt.Sprintf("%s is in maintenance", konn),
					LongMessage:  fmt.Sprintf("%s is really in maintenance", konn),
				},
			},
		}
		if err := registry.ActivateMaintenanceApp(s, konn, opts); err != nil {
			return err
		}
	}

	overs := []string{bazKonn, quxKonn}
	for _, konn := range overs {
		opts := registry.MaintenanceOptions{
			Messages: map[string]registry.MaintenanceMessage{
				"en": {
					ShortMessage: fmt.Sprintf("Maintenance for %s", konn),
					LongMessage:  fmt.Sprintf("Maintenance for %s", konn),
				},
			},
		}
		err := registry.ActivateMaintenanceVirtualSpace(myKonnectorsSpace, konn, opts)
		if err != nil {
			return err
		}
	}

	return registry.DeactivateMaintenanceVirtualSpace(myKonnectorsSpace, quuxKonn)
}

// newUploadRequest builds a multipart request for createVersion, with the
// metadata JSON and the tarball content
func newUploadRequest(t *testing.T, target, metadata string, tarball []byte) *http.Request {
	body := &bytes.Buffer{}
	w := multipart.NewWriter(body)
	require.NoError(t, w.WriteField("metadata", metadata))
	fw, err := w.CreateFormFile("tarball", "../../evil.tar.gz")
	require.NoError(t, err)
	_, err = fw.Write(tarball)
	require.NoError(t, err)
	require.NoError(t, w.Close())
	req := httptest.NewRequest(http.MethodPost, target, body)
	req.Header.Set(echo.HeaderContentType, w.FormDataContentType())
	return req
}

func TestCreateVersionUpload(t *testing.T) {
	target := server.URL + "/registry/" + keptApp
	metadata := `{"version":"1.0.0","sha256":"abc","url":"file:///etc/passwd"}`
	// Larger than the 100K body limit applied to the other requests
	content := bytes.Repeat([]byte("x"), 200<<10)

	c := echo.New().NewContext(newUploadRequest(t, target, metadata, content), httptest.NewRecorder())
	opts := &registry.VersionOptions{}
	require.NoError(t, bindUpload(c, opts))
	assert.Equal(t, "1.0.0", opts.Version)
	assert.Equal(t, content, opts.Tarball)
	// Neither the url from the metadata nor the uploaded file name are used
	assert.Equal(t, "tarball.tar.gz", opts.URL)

	// The metadata comes from the body, not from the query string
	query := url.Values{"metadata": {`{"version":"9.9.9"}`}}.Encode()
	opts = &registry.VersionOptions{}
	c = echo.New().NewContext(newUploadRequest(t, target+"?"+query, metadata, content), httptest.NewRecorder())
	require.NoError(t, bindUpload(c, opts))
	assert.Equal(t, "1.0.0", opts.Version)

	// The metadata field keeps the 100K limit
	req := newUploadRequest(t, target, strings.Repeat(" ", maxMetadataSize+1), nil)
	err := bindUpload(echo.New().NewContext(req, httptest.NewRecorder()), &registry.VersionOptions{})
	var httpErr *errshttp.Error
	require.ErrorAs(t, err, &httpErr)
	assert.Equal(t, http.StatusRequestEntityTooLarge, httpErr.StatusCode())

	// A tarball over the limit is rejected as too large, not as invalid
	req = newUploadRequest(t, target, metadata, make([]byte, registry.MaxApplicationSize+(2<<20)))
	err = bindUpload(echo.New().NewContext(req, httptest.NewRecorder()), &registry.VersionOptions{})
	require.ErrorAs(t, err, &httpErr)
	assert.Equal(t, http.StatusRequestEntityTooLarge, httpErr.StatusCode())
	assert.Contains(t, err.Error(), "bigger than")

	// The route accepts large multipart bodies: it fails on auth, not on
	// Content-Type or body size
	req = newUploadRequest(t, target, metadata, content)
	req.RequestURI = ""
	res, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer res.Body.Close()
	assert.Equal(t, http.StatusUnauthorized, res.StatusCode)

	// JSON bodies keep the 100K limit
	res2, err := http.Post(target, echo.MIMEApplicationJSON, bytes.NewReader(content))
	require.NoError(t, err)
	defer res2.Body.Close()
	assert.Equal(t, http.StatusRequestEntityTooLarge, res2.StatusCode)
}

func TestCreateVersionUploadChecksPermissionsFirst(t *testing.T) {
	// A token of another editor passes the authentication check but not the
	// permission check: the request is rejected on permissions, before the
	// body is read
	base.SessionSecret = auth.GenerateMasterSecret()
	t.Cleanup(func() { base.SessionSecret = nil })
	stranger, err := auth.Editors.CreateEditorWithoutPublicKey("stranger", false)
	require.NoError(t, err)
	t.Cleanup(func() { _ = auth.Editors.DeleteEditor(stranger) })
	token, err := stranger.GenerateEditorToken(base.SessionSecret, 0, keptApp)
	require.NoError(t, err)

	target := fmt.Sprintf("%s/%s/registry/%s", server.URL, allAppsSpace, keptApp)
	req, err := http.NewRequest(http.MethodPost, target, strings.NewReader("not a multipart body"))
	require.NoError(t, err)
	req.Header.Set(echo.HeaderContentType, echo.MIMEMultipartForm+"; boundary=x")
	req.Header.Set(echo.HeaderAuthorization, authTokenScheme+base64.StdEncoding.EncodeToString(token))
	res, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer res.Body.Close()
	assert.Equal(t, http.StatusUnauthorized, res.StatusCode)
}

func TestCheckRedirectIsTrusted(t *testing.T) {
	cfg := base.ConfigParameters{
		TrustedDomains: map[string][]string{
			"__default__": {"mycozy.cloud", "manager.cozycloud.cc"},
		},
		TrustedProtocols: map[string][]string{
			"__default__": {"cozy"},
		},
		TrustedUrls: map[string][]string{
			"__default__": {"https://play.google.com/store/apps/details?id=io.cozy.flagship.mobile"},
		},
	}

	u, err := url.Parse("https://example.mycozy.cloud/")
	require.NoError(t, err)
	assert.True(t, checkRedirectIsTrusted(u, "__default__", cfg))
	assert.False(t, checkRedirectIsTrusted(u, "foobar", cfg))

	u, err = url.Parse("cozy://flagship")
	require.NoError(t, err)
	assert.True(t, checkRedirectIsTrusted(u, "__default__", cfg))
	assert.False(t, checkRedirectIsTrusted(u, "foobar", cfg))

	u, err = url.Parse("evil://")
	require.NoError(t, err)
	assert.False(t, checkRedirectIsTrusted(u, "__default__", cfg))

	u, err = url.Parse("evil://manager.cozycloud.cc/")
	require.NoError(t, err)
	assert.False(t, checkRedirectIsTrusted(u, "__default__", cfg))

	u, err = url.Parse("https://play.google.com/store/apps/details?id=io.cozy.flagship.mobile")
	require.NoError(t, err)
	assert.True(t, checkRedirectIsTrusted(u, "__default__", cfg))
	assert.False(t, checkRedirectIsTrusted(u, "foobar", cfg))

	u, err = url.Parse("https://play.google.com/store/apps/details?id=io.cozy.flagship.mobile&extra=param")
	require.NoError(t, err)
	assert.False(t, checkRedirectIsTrusted(u, "__default__", cfg))

	u, err = url.Parse("https://play.google.com/store/apps/details?id=different.app")
	require.NoError(t, err)
	assert.False(t, checkRedirectIsTrusted(u, "__default__", cfg))
}

func TestIsHostInTheTrustedDomains(t *testing.T) {
	assert.True(t, isHostInTheTrustedDomains("example.mycozy.cloud", []string{"mycozy.cloud"}))
	assert.True(t, isHostInTheTrustedDomains("manager.cozycloud.cc", []string{"manager.cozycloud.cc"}))

	assert.False(t, isHostInTheTrustedDomains("cozycloud.cc", []string{"cozycloud.cc.evil.com"}))
	assert.False(t, isHostInTheTrustedDomains("cozycloud.cc", []string{"evilcozycloud.cc"}))
}
