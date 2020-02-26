package storage

import (
	"io/ioutil"
	"os"
	"strings"
	"testing"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/ncw/swift"
	"github.com/ncw/swift/swifttest"
	"github.com/stretchr/testify/assert"
)

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
	testStorage(t, swift)
}

func TestLocal(t *testing.T) {
	tmp, err := ioutil.TempDir(os.TempDir(), "local")
	assert.NoError(t, err)
	defer os.RemoveAll(tmp)
	local := &localFS{tmp}
	testStorage(t, local)
}

func TestMem(t *testing.T) {
	mem := NewMemFS()
	testStorage(t, mem)
}

func testStorage(t *testing.T, storage base.Storage) {
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

		content = strings.NewReader("other bytes")
		err := storage.Create(bazPrefix, "file-one", "text/plain", content)
		if assert.Error(t, err) {
			assert.Equal(t, 404, err.(base.Error).Code)
		}
	})

	t.Run("Get", func(t *testing.T) {
		buf, headers, err := storage.Get(fooPrefix, "file-one")
		assert.NoError(t, err)
		assert.Equal(t, "some bytes", buf.String())
		assert.Equal(t, "text/plain", headers["Content-Type"])

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
