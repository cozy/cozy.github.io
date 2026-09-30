package storage

import (
	"os"
	"strings"
	"testing"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/internal/testutils"
	"github.com/ncw/swift"
	"github.com/ncw/swift/swifttest"
	"github.com/stretchr/testify/assert"
)

// storageOpts describes the behaviours that legitimately differ between the
// implementations, so that the shared suite can assert the right one instead
// of asserting the loosest.
type storageOpts struct {
	// hasContainers tells whether a container must exist before a file can be
	// written into it. It is true for Swift and for the local file system,
	// which both have something to create. It is false for S3, where a single
	// bucket holds every container as a key prefix, so a write to an unknown
	// prefix has nothing to fail on.
	hasContainers bool
	// hasEtag tells whether Get reports an Etag header. Swift and S3 do; the
	// local file system and the in-memory storage do not. It matters because
	// web/router.go uses it to answer conditional requests.
	hasEtag bool
}

func TestSwift(t *testing.T) {
	// Starting a mock of a swift server (in-memory)
	swiftSrv, err := swifttest.NewSwiftServer("localhost")
	if err != nil {
		t.Fatalf("Cannot start swift test server: %s", err)
	}
	conn := &swift.Connection{
		UserName: "swifttest",
		ApiKey:   "swifttest",
		AuthUrl:  swiftSrv.AuthURL,
	}
	if err := conn.Authenticate(); err != nil {
		t.Fatalf("Cannot authenticate to Swift: %s", err)
	}
	swift := &swiftFS{conn: conn}
	testStorage(t, swift, storageOpts{hasContainers: true, hasEtag: true})
}

func TestLocal(t *testing.T) {
	tmp, err := os.MkdirTemp(os.TempDir(), "local")
	assert.NoError(t, err)
	defer os.RemoveAll(tmp)
	local := &localFS{tmp}
	testStorage(t, local, storageOpts{hasContainers: true})
}

func TestMem(t *testing.T) {
	mem := NewMemFS()
	testStorage(t, mem, storageOpts{hasContainers: true})
}

// TestS3Keys covers the mapping from a container to object keys. It needs no
// server, as the composition is the part that is easy to get wrong.
func TestS3Keys(t *testing.T) {
	prefix := base.Prefix("my-space")
	name := "my-app/1.0.0/icon.svg"

	t.Run("without a global prefix", func(t *testing.T) {
		s := &s3FS{}
		assert.Equal(t, "my-space/my-app/1.0.0/icon.svg", s.key(prefix, name))
		assert.Equal(t, "my-space/", s.keyPrefix(prefix))
	})

	t.Run("with a global prefix", func(t *testing.T) {
		s := &s3FS{globalPrefix: "registry"}
		assert.Equal(t, "registry/my-space/my-app/1.0.0/icon.svg", s.key(prefix, name))
		assert.Equal(t, "registry/my-space/", s.keyPrefix(prefix))
	})

	t.Run("a container prefix cannot match a longer container name", func(t *testing.T) {
		s := &s3FS{}
		assert.Equal(t, "foo/", s.keyPrefix(base.Prefix("foo")))
		// Without the trailing slash, listing "foo" would also return every
		// object of "foobar".
		assert.False(t, strings.HasPrefix(s.keyPrefix(base.Prefix("foobar")), s.keyPrefix(base.Prefix("foo"))))
	})
}

func TestS3(t *testing.T) {
	client, bucket := testutils.MinioBucket(t)

	// A global prefix is configured, so that the suite also exercises the
	// nested layout rather than only the bare one.
	s3 := &s3FS{client: client, bucket: bucket, globalPrefix: "registry"}
	testStorage(t, s3, storageOpts{hasContainers: false, hasEtag: true})
}

func testStorage(t *testing.T, storage base.VirtualStorage, opts storageOpts) {
	fooPrefix := base.Prefix("foo-prefix")
	barPrefix := base.Prefix("bar-prefix")
	bazPrefix := base.Prefix("baz-prefix")

	t.Run("EnsureExists", func(t *testing.T) {
		assert.NoError(t, storage.EnsureExists(fooPrefix))
		assert.NoError(t, storage.EnsureExists(barPrefix))
		assert.NoError(t, storage.EnsureExists(barPrefix))
	})

	t.Run("Create", func(t *testing.T) {
		content := strings.NewReader("some bytes")
		assert.NoError(t, storage.Create(fooPrefix, "file-one", "text/plain", content))

		content = strings.NewReader("more bytes")
		assert.NoError(t, storage.Create(fooPrefix, "file-two", "text/plain", content))

		content = strings.NewReader("a few bytes")
		assert.NoError(t, storage.Create(barPrefix, "file-in-bar", "text/plain", content))

		// bazPrefix was never given to EnsureExists.
		content = strings.NewReader("other bytes")
		err := storage.Create(bazPrefix, "file-one", "text/plain", content)
		if opts.hasContainers {
			if assert.Error(t, err) {
				assert.Equal(t, 404, err.(base.Error).Code)
			}
		} else {
			assert.NoError(t, err)
		}
	})

	t.Run("Get", func(t *testing.T) {
		buf, headers, err := storage.Get(fooPrefix, "file-one")
		assert.NoError(t, err)
		assert.Equal(t, "some bytes", buf.String())
		assert.Equal(t, "text/plain", headers["Content-Type"])
		if opts.hasEtag {
			// Etag, not ETag: the callers read Go's canonical header form.
			assert.NotEmpty(t, headers["Etag"])
		}

		_, _, err = storage.Get(fooPrefix, "no-such-file")
		if assert.Error(t, err) {
			assert.Equal(t, 404, err.(base.Error).Code)
		}

		_, _, err = storage.Get(bazPrefix, "prefix-does-not-exist")
		if assert.Error(t, err) {
			assert.Equal(t, 404, err.(base.Error).Code)
		}
	})

	t.Run("Remove", func(t *testing.T) {
		assert.NoError(t, storage.Remove(fooPrefix, "file-two"))
		_, _, err := storage.Get(fooPrefix, "file-two")
		if assert.Error(t, err) {
			assert.Equal(t, 404, err.(base.Error).Code)
		}

		assert.NoError(t, storage.Remove(fooPrefix, "file-two"))
	})

	t.Run("Walk", func(t *testing.T) {
		names := []string{}
		err := storage.Walk(fooPrefix, func(name, _ string) error {
			names = append(names, name)
			return nil
		})
		assert.NoError(t, err)
		assert.Equal(t, []string{"file-one"}, names)
	})

	t.Run("FindByPrefix", func(t *testing.T) {
		names, err := storage.FindByPrefix(fooPrefix, "file-")
		assert.NoError(t, err)
		assert.Equal(t, []string{"file-one"}, names)

		names, err = storage.FindByPrefix(fooPrefix, "no-such-prefix")
		assert.NoError(t, err)
		assert.Empty(t, names)
	})

	t.Run("EnsureEmpty", func(t *testing.T) {
		assert.NoError(t, storage.EnsureEmpty(barPrefix))
		_, _, err := storage.Get(barPrefix, "file-in-bar")
		if assert.Error(t, err) {
			assert.Equal(t, 404, err.(base.Error).Code)
		}
		content := strings.NewReader("and the final bytes")
		assert.NoError(t, storage.Create(barPrefix, "other-file-in-bar", "text/plain", content))

		assert.NoError(t, storage.EnsureEmpty(barPrefix))
		assert.NoError(t, storage.EnsureEmpty(bazPrefix))
	})
}
