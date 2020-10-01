package storage

import (
	"bytes"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/pkg/xattr"
)

const xattrMime = "user.mime_type"

// NewFS returns a VirtualStorage where the files are persisted in the given
// directory of the local file system.
func NewFS(baseDir string) base.VirtualStorage {
	return &localFS{baseDir: baseDir}
}

type localFS struct {
	baseDir string
}

func (m *localFS) Status() error {
	return nil
}

func (m *localFS) EnsureExists(prefix base.Prefix) error {
	dir := filepath.Join(m.baseDir, string(prefix))
	if err := os.MkdirAll(dir, 0755); err != nil {
		return base.NewInternalError(err)
	}
	return nil
}

func (m *localFS) EnsureEmpty(prefix base.Prefix) error {
	if err := m.EnsureDeleted(prefix); err != nil {
		return err
	}
	return m.EnsureExists(prefix)
}

func (m *localFS) EnsureDeleted(prefix base.Prefix) error {
	dir := filepath.Join(m.baseDir, string(prefix))
	if err := os.RemoveAll(dir); err != nil {
		return base.NewInternalError(err)
	}
	return nil
}

func (m *localFS) getPath(prefix base.Prefix, original string) (string, error) {
	name := filepath.Base(original)
	if name == "." || name == ".." || name == "/" {
		return "", base.NewInternalError(fmt.Errorf("%s is not a valid name", name))
	}
	path := filepath.Join(m.baseDir, string(prefix), original)
	return path, nil
}

func (m *localFS) Create(prefix base.Prefix, name, contentType string, content io.Reader) error {
	path, err := m.getPath(prefix, name)
	if err != nil {
		return err
	}

	f, err := os.Create(path)
	if err != nil {
		dir := filepath.Join(m.baseDir, string(prefix))
		if _, err := os.Stat(dir); err != nil && os.IsNotExist(err) {
			return base.NewFileNotFoundError(err)
		}
		return base.NewInternalError(err)
	}
	defer f.Close()
	if _, err = io.Copy(f, content); err != nil {
		return base.NewInternalError(err)
	}
	_ = xattr.Set(path, xattrMime, []byte(contentType))
	return nil
}

func (m *localFS) Get(prefix base.Prefix, name string) (*bytes.Buffer, map[string]string, error) {
	path, err := m.getPath(prefix, name)
	if err != nil {
		return nil, nil, err
	}
	content, err := ioutil.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil, base.NewFileNotFoundError(err)
		}
		return nil, nil, base.NewInternalError(err)
	}
	buf := bytes.NewBuffer(content)
	length := fmt.Sprintf("%d", buf.Len())
	headers := map[string]string{"Content-Length": length}
	if mime, err := xattr.Get(path, xattrMime); err == nil {
		headers["Content-Type"] = string(mime)
	}
	return buf, headers, nil
}

func (m *localFS) Remove(prefix base.Prefix, name string) error {
	path, err := m.getPath(prefix, name)
	if err != nil {
		return err
	}
	if err := os.Remove(path); err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return base.NewInternalError(err)
	}
	return nil
}

func (m *localFS) Walk(prefix base.Prefix, fn base.WalkFn) error {
	dir := filepath.Join(m.baseDir, string(prefix))

	return filepath.Walk(dir, func(path string, _ os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		name, err := filepath.Rel(dir, path)
		if err != nil {
			return err
		}
		if name == "." {
			return nil
		}
		contentType := "application/octet-stream"
		if mime, err := xattr.Get(path, xattrMime); err == nil {
			contentType = string(mime)
		}
		return fn(name, contentType)
	})
}

func (m *localFS) FindByPrefix(prefix base.Prefix, namePrefix string) ([]string, error) {
	var names []string
	err := m.Walk(prefix, func(name, _ string) error {
		if strings.HasPrefix(name, namePrefix) {
			names = append(names, name)
		}
		return nil
	})
	return names, err
}
