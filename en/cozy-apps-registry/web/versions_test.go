package web

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/cozy/cozy-apps-registry/auth"
	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/registry"
	"github.com/cozy/cozy-apps-registry/space"
	"github.com/cozy/cozy-apps-registry/storage"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// newPublisher creates an app owned by a new editor in the all-apps space, and
// returns a token that only allows to publish this app.
func newPublisher(t *testing.T, slug string) []byte {
	t.Helper()
	if base.SessionSecret == nil {
		base.SessionSecret = auth.GenerateMasterSecret()
		t.Cleanup(func() { base.SessionSecret = nil })
	}
	editor, err := auth.Editors.CreateEditorWithoutPublicKey(strings.ReplaceAll(slug, "-", ""), true)
	require.NoError(t, err)
	t.Cleanup(func() { _ = auth.Editors.DeleteEditor(editor) })

	s, _ := space.GetSpace(allAppsSpace)
	opts := &registry.AppOptions{Editor: editor.Name(), Slug: slug, Type: "webapp"}
	_, err = registry.CreateApp(s, opts, editor)
	require.NoError(t, err)

	token, err := editor.GenerateEditorToken(base.SessionSecret, 0, slug)
	require.NoError(t, err)
	return token
}

// serveTarball serves a tarball with the given manifest slug and version, and
// returns its URL with the given file name and its checksum.
func serveTarball(t *testing.T, slug, version, filename string) (string, string) {
	t.Helper()
	manifest, err := json.Marshal(map[string]string{
		"slug":    slug,
		"editor":  "whoever",
		"version": version,
	})
	require.NoError(t, err)

	buf := &bytes.Buffer{}
	gw := gzip.NewWriter(buf)
	tw := tar.NewWriter(gw)
	hdr := &tar.Header{Name: "manifest.webapp", Size: int64(len(manifest)), Mode: 0644}
	require.NoError(t, tw.WriteHeader(hdr))
	_, err = tw.Write(manifest)
	require.NoError(t, err)
	require.NoError(t, tw.Close())
	require.NoError(t, gw.Close())
	content := buf.Bytes()

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set(echo.HeaderContentType, "application/gzip")
		_, _ = w.Write(content)
	}))
	t.Cleanup(srv.Close)
	sum := sha256.Sum256(content)
	return srv.URL + "/" + filename, hex.EncodeToString(sum[:])
}

// postVersion publishes a version of an app of the all-apps space, and returns
// the status code and the body of the response.
func postVersion(t *testing.T, token []byte, slug, version, tarballURL, shasum string) (int, string) {
	t.Helper()
	body, err := json.Marshal(map[string]string{
		"version": version,
		"url":     tarballURL,
		"sha256":  shasum,
	})
	require.NoError(t, err)
	target := fmt.Sprintf("%s/%s/registry/%s", server.URL, allAppsSpace, slug)
	req, err := http.NewRequest(http.MethodPost, target, bytes.NewReader(body))
	require.NoError(t, err)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	req.Header.Set(echo.HeaderAuthorization, authTokenScheme+base64.StdEncoding.EncodeToString(token))
	res, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer res.Body.Close()
	resBody, err := io.ReadAll(res.Body)
	require.NoError(t, err)
	return res.StatusCode, string(resBody)
}

func TestCreateVersionRefusesLocalFile(t *testing.T) {
	token := newPublisher(t, "file-url-app")

	content := []byte("a local file of the server")
	secret := filepath.Join(t.TempDir(), "secret")
	require.NoError(t, os.WriteFile(secret, content, 0600))
	sum := sha256.Sum256(content)

	for _, fileURL := range []string{"file://" + secret, "FILE://" + secret, "file:" + secret} {
		status, body := postVersion(t, token, "file-url-app", "1.0.0", fileURL, strings.Repeat("0", 64))
		assert.Equal(t, http.StatusBadRequest, status, fileURL)
		assert.Contains(t, body, "erroneous: url", fileURL)
		// The checksum error would give away the hash of the file
		assert.NotContains(t, body, hex.EncodeToString(sum[:]), fileURL)
	}
}

func TestCreateVersionChecksTheManifestSlug(t *testing.T) {
	token := newPublisher(t, "publisher-app")
	newPublisher(t, "victim-app")

	s, _ := space.GetSpace(allAppsSpace)
	prefix := s.GetPrefix()
	original := []byte("the tarball of the victim")
	stored := "victim-app/1.0.0/app.tar.gz"
	require.NoError(t, base.Storage.Create(prefix, stored, "application/gzip", bytes.NewReader(original)))

	// Overwriting a tarball of another app
	tarballURL, shasum := serveTarball(t, "victim-app", "1.0.0", "app.tar.gz")
	status, body := postVersion(t, token, "publisher-app", "1.0.0", tarballURL, shasum)
	assert.Equal(t, http.StatusBadRequest, status)
	assert.Contains(t, body, registry.ErrVersionSlugMismatch.Error())
	content, _, err := base.Storage.Get(prefix, stored)
	require.NoError(t, err)
	assert.Equal(t, original, content.Bytes())

	// Adding a file next to the tarball of another app
	tarballURL, shasum = serveTarball(t, "victim-app", "1.0.0", "planted.tar.gz")
	status, _ = postVersion(t, token, "publisher-app", "1.0.0", tarballURL, shasum)
	assert.Equal(t, http.StatusBadRequest, status)
	_, _, err = base.Storage.Get(prefix, "victim-app/1.0.0/planted.tar.gz")
	assert.Error(t, err)

	// The tarball of the app itself is accepted
	tarballURL, shasum = serveTarball(t, "publisher-app", "1.0.0", "app.tar.gz")
	status, body = postVersion(t, token, "publisher-app", "1.0.0", tarballURL, shasum)
	assert.Equal(t, http.StatusCreated, status, body)
	_, _, err = base.Storage.Get(prefix, "publisher-app/1.0.0/app.tar.gz")
	assert.NoError(t, err)
}

func TestCreateVersionRefusesInvalidManifestSlug(t *testing.T) {
	token := newPublisher(t, "slug-format-app")

	// The local storage resolves the dots of a path
	root := t.TempDir()
	memStorage := base.Storage
	base.Storage = storage.NewFS(filepath.Join(root, "storage"))
	t.Cleanup(func() { base.Storage = memStorage })
	s, _ := space.GetSpace(allAppsSpace)
	require.NoError(t, base.Storage.EnsureExists(s.GetPrefix()))

	slugs := []string{"../../escaped", "../" + keptApp, "slug-format-app/../../escaped", "Slug-Format-App"}
	for _, slug := range slugs {
		tarballURL, shasum := serveTarball(t, slug, "1.0.0", "app.tar.gz")
		status, body := postVersion(t, token, "slug-format-app", "1.0.0", tarballURL, shasum)
		assert.Equal(t, http.StatusBadRequest, status, slug)
		assert.Contains(t, body, registry.ErrAppSlugInvalid.Error(), slug)
	}

	var written []string
	require.NoError(t, filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err == nil && !d.IsDir() {
			written = append(written, path)
		}
		return err
	}))
	assert.Empty(t, written)
}
