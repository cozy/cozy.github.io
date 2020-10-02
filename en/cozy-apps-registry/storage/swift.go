// Package storage can be used to persist files in a storage. It is Open-Stack
// Swift in production, but having a Swift server in local for development can
// be difficult, so this package can also used a local file system for the
// storage.
package storage

import (
	"bytes"
	"io"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/ncw/swift"
	"github.com/sirupsen/logrus"
)

// NewSwift returns a VirtualStorage where the files are persisted in Swift.
func NewSwift(conn *swift.Connection) base.VirtualStorage {
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

func (s *swiftFS) Status() error {
	_, err := s.conn.QueryInfo()
	return err
}

func (s *swiftFS) EnsureExists(prefix base.Prefix) error {
	err := s.conn.ContainerCreate(string(prefix), nil)
	return s.wrapError(err)
}

func (s *swiftFS) EnsureEmpty(prefix base.Prefix) error {
	if err := s.EnsureDeleted(prefix); err != nil {
		return s.wrapError(err)
	}
	return s.EnsureExists(prefix)
}

func (s swiftFS) EnsureDeleted(prefix base.Prefix) error {
	return deleteContainer(s.conn, string(prefix))
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
	if headers["Content-Length"] == "" {
		log := logrus.WithFields(logrus.Fields{
			"nspace": "storage",
			"space":  string(prefix),
			"object": name,
		})
		log.Warn("No Content-Length on the response for getting an object from Swift")
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

func (s *swiftFS) Walk(prefix base.Prefix, fn base.WalkFn) error {
	return s.conn.ObjectsWalk(string(prefix), nil, func(opts *swift.ObjectsOpts) (interface{}, error) {
		objects, err := s.conn.Objects(string(prefix), opts)
		if err != nil {
			return nil, err
		}
		for _, object := range objects {
			if err := fn(object.Name, object.ContentType); err != nil {
				return nil, err
			}
		}
		return objects, nil
	})
}

func (s *swiftFS) FindByPrefix(prefix base.Prefix, namePrefix string) ([]string, error) {
	opts := &swift.ObjectsOpts{Prefix: namePrefix}
	objs, err := s.conn.ObjectsAll(string(prefix), opts)
	if err != nil {
		return nil, s.wrapError(err)
	}
	names := make([]string, len(objs))
	for i, obj := range objs {
		names[i] = obj.Name
	}
	return names, nil
}
