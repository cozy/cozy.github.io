package storage

import (
	"bytes"
	"io"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/ncw/swift"
)

// TODO remove NewSwift
func NewSwift(conn *swift.Connection) base.Storage {
	return &swiftFS{conn: conn}
}

type swiftFS struct {
	conn *swift.Connection
}

func (s *swiftFS) wrapError(err error) error {
	switch err {
	case nil:
		return nil
	case swift.ObjectNotFound:
		return base.NewFileNotFoundError(err)
	case swift.TooLargeObject:
		return base.NewTooLargeError(err)
	default:
		return base.NewInternalError(err)
	}
}

func (s *swiftFS) EnsureExists(prefix base.Prefix) error {
	err := s.conn.ContainerCreate(string(prefix), nil)
	return s.wrapError(err)
}

func (s *swiftFS) EnsureEmpty(prefix base.Prefix) error {
	if err := deleteContainer(s.conn, string(prefix)); err != nil {
		return s.wrapError(err)
	}
	return s.EnsureExists(prefix)
}

func (s *swiftFS) Create(prefix base.Prefix, name, contentType string, content io.Reader) error {
	f, err := s.conn.ObjectCreate(string(prefix), name, true, "", contentType, nil)
	if err != nil {
		return s.wrapError(err)
	}

	_, err = io.Copy(f, content)
	if e := f.Close(); e != nil && err == nil {
		err = e
	}
	return s.wrapError(err)
}

func (s *swiftFS) Get(prefix base.Prefix, name string) (*bytes.Buffer, map[string]string, error) {
	buf := new(bytes.Buffer)
	headers, err := s.conn.ObjectGet(string(prefix), name, buf, false, nil)
	if err != nil {
		return nil, nil, s.wrapError(err)
	}
	return buf, headers, nil
}

func (s *swiftFS) Remove(prefix base.Prefix, name string) error {
	err := s.conn.ObjectDelete(string(prefix), name)
	// If the object is not found, it's OK.
	if err == swift.ObjectNotFound {
		err = nil
	}
	return s.wrapError(err)
}
