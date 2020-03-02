package storage

import (
	"bytes"
	"fmt"
	"io"
	"strings"

	"github.com/cozy/cozy-apps-registry/base"
)

// NewMemFS returns a storage where files are kept in memory. Obviously, it
// must not be used in production, but it can be convenient for unit tests.
func NewMemFS() base.VirtualStorage {
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

func (m *memFS) Status() error {
	return nil
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

func (m *memFS) EnsureDeleted(prefix base.Prefix) error {
	delete(m.prefixes, prefix)
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

func (m *memFS) Walk(prefix base.Prefix, fn base.WalkFn) error {
	p, ok := m.prefixes[prefix]
	if !ok {
		return base.NewFileNotFoundError(fmt.Errorf("Prefix %s not found", prefix))
	}

	for key, f := range p {
		if err := fn(key, f.mime); err != nil {
			return err
		}
	}

	return nil
}

func (m *memFS) FindByPrefix(prefix base.Prefix, namePrefix string) ([]string, error) {
	var names []string
	err := m.Walk(prefix, func(name, _ string) error {
		if strings.HasPrefix(name, namePrefix) {
			names = append(names, name)
		}
		return nil
	})
	return names, err
}
