package storage

import (
	"bytes"
	"fmt"
	"io"

	"github.com/cozy/cozy-apps-registry/base"
)

// NewMemFS returns a storage where files are kept in memory. Obviously, it
// must not be used in production, but it can be convenient for unit tests.
func NewMemFS() base.Storage {
	return &memFS{
		prefixes: make(map[base.Prefix]memPrefix),
	}
}

type memFS struct {
	prefixes map[base.Prefix]memPrefix
}
type memPrefix map[string]memFile
type memFile struct {
	mime    string
	content *bytes.Buffer
}

func (m *memFS) EnsureExists(prefix base.Prefix) error {
	if _, ok := m.prefixes[prefix]; !ok {
		m.prefixes[prefix] = make(memPrefix)
	}
	return nil
}

func (m *memFS) EnsureEmpty(prefix base.Prefix) error {
	m.prefixes[prefix] = make(memPrefix)
	return nil
}

func (m *memFS) Create(prefix base.Prefix, name, contentType string, content io.Reader) error {
	if _, ok := m.prefixes[prefix]; !ok {
		return base.NewFileNotFoundError(fmt.Errorf("Prefix %s not found", prefix))
	}

	f := memFile{content: &bytes.Buffer{}, mime: contentType}
	if _, err := f.content.ReadFrom(content); err != nil {
		return base.NewInternalError(err)
	}

	m.prefixes[prefix][name] = f
	return nil
}

func (m *memFS) Get(prefix base.Prefix, name string) (*bytes.Buffer, map[string]string, error) {
	p, ok := m.prefixes[prefix]
	if !ok {
		return nil, nil, base.NewFileNotFoundError(fmt.Errorf("Prefix %s not found", prefix))
	}

	f, ok := p[name]
	if !ok {
		return nil, nil, base.NewFileNotFoundError(fmt.Errorf("File %s not found", name))
	}

	buf := bytes.NewBuffer(f.content.Bytes())
	headers := map[string]string{"Content-Type": f.mime}
	return buf, headers, nil
}

func (m *memFS) Remove(prefix base.Prefix, name string) error {
	if _, ok := m.prefixes[prefix]; !ok {
		return base.NewFileNotFoundError(fmt.Errorf("Prefix %s not found", prefix))
	}

	delete(m.prefixes[prefix], name)
	return nil
}
