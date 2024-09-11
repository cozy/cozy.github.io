package web

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"testing"

	"github.com/go-kivik/kivik/v3"

	"github.com/cozy/cozy-apps-registry/auth"
	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/config"
	"github.com/cozy/cozy-apps-registry/registry"
	"github.com/cozy/cozy-apps-registry/space"
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

func TestCheckRedirectIsTrusted(t *testing.T) {
	cfg := base.ConfigParameters{
		TrustedDomains: map[string][]string{
			"__default__": {"mycozy.cloud", "manager.cozycloud.cc"},
		},
		TrustedProtocols: map[string][]string{
			"__default__": {"cozy"},
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
}

func TestIsHostInTheTrustedDomains(t *testing.T) {
	assert.True(t, isHostInTheTrustedDomains("example.mycozy.cloud", []string{"mycozy.cloud"}))
	assert.True(t, isHostInTheTrustedDomains("manager.cozycloud.cc", []string{"manager.cozycloud.cc"}))

	assert.False(t, isHostInTheTrustedDomains("cozycloud.cc", []string{"cozycloud.cc.evil.com"}))
	assert.False(t, isHostInTheTrustedDomains("cozycloud.cc", []string{"evilcozycloud.cc"}))
}
