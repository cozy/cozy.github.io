package registry

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"testing"
	"time"

	"github.com/cozy/cozy-apps-registry/asset"
	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/space"
	"github.com/go-kivik/kivik/v3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const legacyContent = "the content of an asset stored in the app container"

// createLegacyVersion publishes a version whose asset still lives in the app
// container, at <slug>/<version>/<filename>, like the ones published before
// the global asset store.
func createLegacyVersion(t *testing.T, s *space.Space, slug, version, filename string) *Version {
	t.Helper()
	return createLegacyVersionIn(t, s, s.VersDB(), slug, version, filename)
}

// createLegacyVersionIn is createLegacyVersion for the database of versions
// given, the published or the pending ones.
func createLegacyVersionIn(t *testing.T, s *space.Space, db *kivik.DB, slug, version, filename string) *Version {
	t.Helper()
	ver := &Version{
		ID:        getVersionID(slug, version),
		Slug:      slug,
		Version:   version,
		Type:      "webapp",
		Manifest:  json.RawMessage(`{}`),
		CreatedAt: time.Now(),
		URL:       "https://registry.example.org/registry/" + slug + "/" + version + "/tarball/" + filename,
	}
	rev, err := db.Put(context.Background(), ver.ID, ver)
	require.NoError(t, err)
	ver.Rev = rev

	fp := slug + "/" + version + "/" + filename
	require.NoError(t, base.Storage.Create(s.GetPrefix(), fp, "application/gzip", bytes.NewReader([]byte(legacyContent))))
	return ver
}

func assertObjectExists(t *testing.T, s *space.Space, fp string) {
	t.Helper()
	_, _, err := base.Storage.Get(s.GetPrefix(), fp)
	assert.NoError(t, err)
}

func assertObjectRemoved(t *testing.T, s *space.Space, fp string) {
	t.Helper()
	_, _, err := base.Storage.Get(s.GetPrefix(), fp)
	assert.ErrorIs(t, err, base.ErrFileNotFound)
}

func TestFindVersionAttachmentStaysInTheVersionFolder(t *testing.T) {
	s, _ := space.GetSpace(testSpaceName)
	const filename = "app.tar.gz"
	ver := createLegacyVersion(t, s, "traversal-reader", "1.0.0", filename)
	createLegacyVersion(t, s, "traversal-victim", "1.0.0", filename)

	for _, name := range []string{
		"../../traversal-victim/1.0.0/" + filename,
		"screenshots/../../../traversal-victim/1.0.0/" + filename,
		"/traversal-victim/1.0.0/" + filename,
		"..",
		".",
		"screenshots/..",
		"",
	} {
		_, err := FindVersionAttachment(s, ver, name)
		assert.ErrorIs(t, err, base.ErrFileNotFound, name)
	}

	// A name with a folder of its own is still read. The version has no ID so
	// that the read does not start moving the asset.
	const screenshot = "screenshots/one.png"
	require.NoError(t, base.Storage.Create(s.GetPrefix(), "traversal-reader/1.0.0/"+screenshot, "image/png", bytes.NewReader([]byte(legacyContent))))
	reader := *ver
	reader.ID = ""
	att, err := FindVersionAttachment(s, &reader, screenshot)
	require.NoError(t, err)
	content, err := io.ReadAll(att.Content)
	require.NoError(t, err)
	assert.Equal(t, legacyContent, string(content))
}

// The latest versions cache is not updated by a move, and it may be held by
// another instance of the registry: the readers can get a version document
// older than the move, which does not reference the asset yet.
func TestReadersOfAVersionOlderThanTheMove(t *testing.T) {
	s, _ := space.GetSpace(testSpaceName)
	const slug = "move-asset-stale"
	const filename = "app.tar.gz"
	ver := createLegacyVersion(t, s, slug, "1.0.0", filename)

	cached, err := json.Marshal(ver)
	require.NoError(t, err)
	key := base.NewKey(s.Name, slug, ChannelToStr(Stable))
	base.LatestVersionsCache.Add(key, cached)
	t.Cleanup(func() { base.LatestVersionsCache.Remove(key) })

	stale := *ver
	require.NoError(t, MoveAssetToGlobalDatabase(s, ver, []byte(legacyContent), filename, "application/gzip"))
	assertObjectRemoved(t, s, slug+"/1.0.0/"+filename)

	assertContent := func(t *testing.T, r io.Reader) {
		t.Helper()
		content, err := io.ReadAll(r)
		require.NoError(t, err)
		assert.Equal(t, legacyContent, string(content))
	}

	t.Run("FindVersionAttachment", func(t *testing.T) {
		att, err := FindVersionAttachment(s, &stale, filename)
		require.NoError(t, err)
		assertContent(t, att.Content)
	})

	t.Run("FindAppAttachment", func(t *testing.T) {
		att, err := FindAppAttachment(s, slug, filename, Stable)
		require.NoError(t, err)
		assertContent(t, att.Content)
	})

	t.Run("getOriginalTarball", func(t *testing.T) {
		latest, err := FindLatestVersion(s, slug, Stable)
		require.NoError(t, err)
		require.Empty(t, latest.AttachmentReferences, "the version should come from the cache")
		tarball, err := getOriginalTarball(s, latest)
		require.NoError(t, err)
		assertContent(t, tarball)
	})
}

func TestFindVersionAttachmentNotFound(t *testing.T) {
	s, _ := space.GetSpace(testSpaceName)
	ver := createLegacyVersion(t, s, "move-asset-missing", "1.0.0", "app.tar.gz")

	_, err := FindVersionAttachment(s, ver, "does-not-exist")
	assert.ErrorIs(t, err, base.ErrFileNotFound)

	unpublished := *ver
	unpublished.Version = "2.0.0"
	_, err = FindVersionAttachment(s, &unpublished, "app.tar.gz")
	assert.ErrorIs(t, err, base.ErrFileNotFound)
}

func TestMoveAssetToGlobalDatabaseDoesNotPublishAPendingVersion(t *testing.T) {
	s, _ := space.GetSpace(testSpaceName)
	const slug = "move-asset-pending"
	const filename = "app.tar.gz"

	// CouchDB only refuses a revision unknown to the database when the shard of
	// the document is empty, which never happens outside of the tests.
	for _, version := range []string{"0.0.1", "0.0.2", "0.0.3", "0.0.4", "0.0.5", "0.0.6", "0.0.7", "0.0.8"} {
		createLegacyVersion(t, s, "move-asset-seed", version, filename)
	}

	ver := createLegacyVersionIn(t, s, s.PendingVersDB(), slug, "1.0.0", filename)
	fp := slug + "/1.0.0/" + filename

	require.NoError(t, MoveAssetToGlobalDatabase(s, ver, []byte(legacyContent), filename, "application/gzip"))

	assertObjectExists(t, s, fp)
	_, err := FindPublishedVersion(s, slug, "1.0.0")
	assert.ErrorIs(t, err, ErrVersionNotFound)

	pending, err := FindPendingVersion(s, slug, "1.0.0")
	require.NoError(t, err)
	assert.Empty(t, pending.AttachmentReferences)

	_, err = ApprovePendingVersion(s, pending, &App{Slug: slug})
	require.NoError(t, err)
	_, err = FindPublishedVersion(s, slug, "1.0.0")
	assert.NoError(t, err)
	assertObjectExists(t, s, fp)
}

func TestMoveAssetToGlobalDatabaseRemovesTheOldObject(t *testing.T) {
	s, _ := space.GetSpace(testSpaceName)
	const slug = "move-asset-removed"
	const filename = "app.tar.gz"
	ver := createLegacyVersion(t, s, slug, "1.0.0", filename)

	// An unrelated object with the name of the asset, at the container root.
	prefix := s.GetPrefix()
	require.NoError(t, base.Storage.Create(prefix, filename, "text/plain", bytes.NewReader([]byte("unrelated"))))
	t.Cleanup(func() { _ = base.Storage.Remove(prefix, filename) })

	require.NoError(t, MoveAssetToGlobalDatabase(s, ver, []byte(legacyContent), filename, "application/gzip"))

	assertObjectRemoved(t, s, slug+"/1.0.0/"+filename)
	assertObjectExists(t, s, filename)

	saved, err := FindVersion(s, slug, "1.0.0")
	require.NoError(t, err)
	assert.NotEmpty(t, saved.AttachmentReferences[filename])

	att, err := FindVersionAttachment(s, saved, filename)
	require.NoError(t, err)
	content, err := io.ReadAll(att.Content)
	require.NoError(t, err)
	assert.Equal(t, legacyContent, string(content))
}

// The global store does not upload an asset whose document already exists, so
// a document left without its object must not lead to the loss of the old one.
func TestMoveAssetToGlobalDatabaseKeepsTheOldObjectWithoutTheMovedOne(t *testing.T) {
	s, _ := space.GetSpace(testSpaceName)
	const slug = "move-asset-lost"
	const filename = "app.tar.gz"
	ver := createLegacyVersion(t, s, slug, "1.0.0", filename)

	content := []byte("an asset whose object is missing from the global store")
	lost := &base.Asset{Name: filename, AppSlug: "move-asset-other", ContentType: "application/gzip"}
	require.NoError(t, base.GlobalAssetStore.Add(lost, bytes.NewReader(content), "move-asset-other/1.0.0"))
	require.NoError(t, base.Storage.Remove(asset.AssetContainerName, lost.Shasum))
	t.Cleanup(func() {
		db := base.GlobalAssetStore.GetDB()
		var doc base.Asset
		if err := db.Get(context.Background(), lost.Shasum).ScanDoc(&doc); err == nil {
			_, _ = db.Delete(context.Background(), doc.ID, doc.Rev)
		}
	})

	require.Error(t, MoveAssetToGlobalDatabase(s, ver, content, filename, "application/gzip"))

	assertObjectExists(t, s, slug+"/1.0.0/"+filename)
	saved, err := FindVersion(s, slug, "1.0.0")
	require.NoError(t, err)
	assert.Empty(t, saved.AttachmentReferences)
}
