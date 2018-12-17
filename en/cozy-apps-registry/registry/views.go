package registry

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/go-kivik/kivik"
)

const (
	viewsHelpers = `
function getVersionChannel(version) {
  if (version.indexOf("-dev.") >= 0) {
    return "dev";
  }
  if (version.indexOf("-beta.") >= 0) {
    return "beta";
  }
  return "stable";
}

function expandVersion(doc) {
  var v = [0, 0, 0];
  var exp = 0;
  var sp = doc.version.split(".");
  if (sp.length >= 3) {
    v[0] = parseInt(sp[0], 10);
    v[1] = parseInt(sp[1], 10);
    v[2] = parseInt(sp[2].split("-")[0], 10);
    var channel = getVersionChannel(doc.version);
    if (channel == "beta" && sp.length > 3) {
      exp = parseInt(sp[3], 10)
    }
  }
  return {
    v: v,
    channel: channel,
    code: (channel == "stable") ? 1 : 0,
    exp: exp,
    date: doc.created_at,
  };
}`

	devView = `
function(doc) {
  ` + viewsHelpers + `
  if (doc.slug != %q) {
    return
  }
  var version = expandVersion(doc);
  var key = version.v.concat(version.code, +new Date(version.date))
  emit(key, doc.version);
}`

	betaView = `
function(doc) {
  ` + viewsHelpers + `
  if (doc.slug != %q) {
    return
  }
  var version = expandVersion(doc);
  var channel = version.channel;
  if (channel == "beta" || channel == "stable") {
    var key = version.v.concat(version.code, version.exp)
    emit(key, doc.version);
  }
}`

	stableView = `
function(doc) {
  ` + viewsHelpers + `
  if (doc.slug != %q) {
    return
  }
  var version = expandVersion(doc);
  var channel = version.channel;
  if (channel == "stable") {
    var key = version.v;
    emit(key, doc.version);
  }
}`
)

type view struct {
	Map string `json:"map"`
}

var versionsViews = map[string]view{
	"dev":    {Map: devView},
	"beta":   {Map: betaView},
	"stable": {Map: stableView},
}

func versViewDocName(appSlug string) string {
	return "versions-" + appSlug + "-v2"
}

func createVersionsViews(c *Space, db *kivik.DB, appSlug string) error {
	docID := fmt.Sprintf("_design/%s", url.PathEscape(versViewDocName(appSlug)))

	var viewsBodies []string
	for name, view := range versionsViews {
		code := fmt.Sprintf(view.Map, appSlug)
		viewsBodies = append(viewsBodies,
			string(sprintfJSON(`%s: {"map": %s}`, name, code)))
	}

	viewsBody := json.RawMessage(`{` + strings.Join(viewsBodies, ",") + `}`)

	doc := struct {
		ID       string          `json:"_id"`
		Views    json.RawMessage `json:"views"`
		Language string          `json:"language"`
	}{
		ID:       docID,
		Views:    viewsBody,
		Language: "javascript",
	}

	_, _, err := db.CreateDoc(ctx, doc)
	if err != nil {
		if kivik.StatusCode(err) == http.StatusConflict {
			return nil
		}
		return fmt.Errorf("Could not create versions views: %s", err)
	}
	return nil
}
