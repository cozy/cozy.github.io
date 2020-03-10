package web

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/cozy/cozy-apps-registry/auth"
	"github.com/cozy/cozy-apps-registry/config"
	"github.com/cozy/cozy-apps-registry/registry"
	"github.com/cozy/cozy-apps-registry/space"
	"github.com/spf13/viper"
	"github.com/stretchr/testify/assert"
)

const (
	allAppsSpace   = "all-apps"
	myAppsSpace    = "my-apps"
	keptApp        = "kept"
	rejectedApp    = "rejected"
	overwrittenApp = "overwritten"
)

const (
	allKonnectorsSpace = "all-konnectors"
	myKonnectorsSpace  = "my-konnectors"
	fooKonn            = "foo"    // foo is rejected from the virtual space
	barKonn            = "bar"    // bar is not in maintenance
	bazKonn            = "baz"    // baz is not in maintenance, but its maintenance status is overwritten in my-konnectors
	quxKonn            = "qux"    // qux is in maintenance, but is maintenance status is overwritten in my-konnectors
	quuxKonn           = "quux"   // quux is like qux (its role is just to change the number of konnectors in maintenance)
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

	if err := config.PrepareSpaces(); err != nil {
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

	return nil
}
