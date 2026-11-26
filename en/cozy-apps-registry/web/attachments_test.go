package web

import (
	"fmt"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/space"
	"github.com/cozy/cozy-apps-registry/storage"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Every route reading an attachment of a version refuses a name outside of the
// folder of the version. The requests are sent as is, without normalizing the
// dot segments like a browser would do.
//
// The test runs on the local file system, where a dot segment reaches the
// parent folder and where the folder of the version itself is not a file.
func TestAttachmentRoutesStayInTheVersionFolder(t *testing.T) {
	s, ok := space.GetSpace(allAppsSpace)
	require.True(t, ok)
	prefix := s.GetPrefix()

	previous := base.Storage
	base.Storage = storage.NewFS(t.TempDir())
	t.Cleanup(func() { base.Storage = previous })
	require.NoError(t, base.Storage.EnsureExists(prefix))

	const secret = "other-app/1.0.0/app.tar.gz"
	require.NoError(t, base.Storage.Create(prefix, secret, "application/gzip", strings.NewReader(secret)))
	// So that the folder of the version exists.
	screenshot := overwrittenApp + "/1.2.3/screenshots/one.png"
	require.NoError(t, base.Storage.Create(prefix, screenshot, "image/png", strings.NewReader(screenshot)))
	// A screenshot route must not serve the tarball, which a virtual space
	// overwrites on the tarball route only.
	tarball := overwrittenApp + "/1.2.3/app.tar.gz"
	require.NoError(t, base.Storage.Create(prefix, tarball, "application/gzip", strings.NewReader(tarball)))

	// From <slug>/<version>/screenshots, three levels up is the container.
	const traversal = "../../../" + secret
	app := fmt.Sprintf("/%s/registry/%s", allAppsSpace, overwrittenApp)
	virtualApp := fmt.Sprintf("/%s/registry/%s", myAppsSpace, overwrittenApp)
	for _, path := range []string{
		app + "/screenshots/" + traversal,
		app + "/stable/latest/screenshots/" + traversal,
		app + "/1.2.3/screenshots/" + traversal,
		app + "/1.2.3/screenshots/..",
		app + "/screenshots/../app.tar.gz",
		app + "/1.2.3/screenshots/../app.tar.gz",
		app + "/1.2.3/tarball/.",
		app + "/1.2.3/tarball/..",
		virtualApp + "/screenshots/" + traversal,
		virtualApp + "/stable/latest/screenshots/" + traversal,
		virtualApp + "/1.2.3/screenshots/" + traversal,
		virtualApp + "/screenshots/../app.tar.gz",
		virtualApp + "/1.2.3/screenshots/../app.tar.gz",
	} {
		res, err := http.Get(server.URL + path)
		require.NoError(t, err)
		body, err := io.ReadAll(res.Body)
		res.Body.Close()
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, res.StatusCode, path)
		assert.NotContains(t, string(body), secret, path)
		assert.NotContains(t, string(body), tarball, path)
	}
}
