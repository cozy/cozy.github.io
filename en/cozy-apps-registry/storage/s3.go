package storage

import (
	"bytes"
	"context"
	"io"
	"path"
	"strconv"
	"strings"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/minio/minio-go/v7"
)

// NewS3 returns a VirtualStorage where the files are persisted in an
// S3-compatible object store.
//
// Every container lives in a single bucket, as a first-level key prefix. A
// bucket per container is not an option: bucket names are globally unique, the
// quota per account is low, and deletion is asynchronous. The optional
// globalPrefix nests all of them under a common path, so that the bucket can
// be shared with another use.
func NewS3(client *minio.Client, bucket, globalPrefix string) base.VirtualStorage {
	return &s3FS{client: client, bucket: bucket, globalPrefix: globalPrefix}
}

type s3FS struct {
	client       *minio.Client
	bucket       string
	globalPrefix string
}

// key returns the object key holding a file of a container.
func (s *s3FS) key(prefix base.Prefix, name string) string {
	return path.Join(s.globalPrefix, prefix.String(), name)
}

// keyPrefix returns the key prefix holding every object of a container. The
// trailing slash matters: without it, listing the container "foo" would also
// match the objects of "foobar".
func (s *s3FS) keyPrefix(prefix base.Prefix) string {
	return path.Join(s.globalPrefix, prefix.String()) + "/"
}

func (s *s3FS) wrapError(err error) error {
	if err == nil {
		return nil
	}
	switch minio.ToErrorResponse(err).Code {
	case "NoSuchKey", "NoSuchBucket":
		return base.NewFileNotFoundError(err)
	case "EntityTooLarge":
		return base.NewTooLargeError(err)
	default:
		return base.NewInternalError(err)
	}
}

func (s *s3FS) Status() error {
	return checkBucket(context.Background(), s.client, s.bucket)
}

// EnsureExists does nothing: there is no container object to create in a
// single bucket, and the bucket itself is created or checked once when the
// storage is set up.
//
// A consequence is that Create does not fail on a container that was never
// declared, unlike the Swift and local file system implementations.
func (s *s3FS) EnsureExists(prefix base.Prefix) error {
	return nil
}

func (s *s3FS) EnsureEmpty(prefix base.Prefix) error {
	err := deletePrefixObjects(context.Background(), s.client, s.bucket, s.keyPrefix(prefix))
	return s.wrapError(err)
}

// EnsureDeleted is the same as EnsureEmpty: once the objects under the prefix
// are gone, nothing is left of the container to delete.
func (s *s3FS) EnsureDeleted(prefix base.Prefix) error {
	return s.EnsureEmpty(prefix)
}

func (s *s3FS) Create(prefix base.Prefix, name, contentType string, content io.Reader) error {
	// A size of -1 makes minio-go stream the content and switch to a
	// multipart upload when it grows past the threshold, so there is no
	// maximum object size to work around here.
	_, err := s.client.PutObject(context.Background(), s.bucket, s.key(prefix, name),
		content, -1, minio.PutObjectOptions{ContentType: contentType})
	return s.wrapError(err)
}

func (s *s3FS) Get(prefix base.Prefix, name string) (*bytes.Buffer, map[string]string, error) {
	obj, err := s.client.GetObject(context.Background(), s.bucket, s.key(prefix, name),
		minio.GetObjectOptions{})
	if err != nil {
		return nil, nil, s.wrapError(err)
	}
	defer obj.Close()

	// GetObject is lazy: it sends no request until the object is read or
	// stated, so this is where a missing object is reported.
	info, err := obj.Stat()
	if err != nil {
		return nil, nil, s.wrapError(err)
	}

	buf := new(bytes.Buffer)
	if _, err := buf.ReadFrom(obj); err != nil {
		return nil, nil, s.wrapError(err)
	}

	// Etag, not ETag: the other implementations expose the headers in Go's
	// canonical form and the callers read that spelling. minio-go has already
	// stripped the quotes S3 puts around the value.
	headers := map[string]string{
		"Content-Type":   info.ContentType,
		"Content-Length": strconv.FormatInt(info.Size, 10),
		"Etag":           info.ETag,
	}
	return buf, headers, nil
}

func (s *s3FS) Remove(prefix base.Prefix, name string) error {
	err := s.client.RemoveObject(context.Background(), s.bucket, s.key(prefix, name),
		minio.RemoveObjectOptions{})
	// If the object is not found, it's OK.
	if isS3NotFound(err) {
		return nil
	}
	return s.wrapError(err)
}

func (s *s3FS) Walk(prefix base.Prefix, fn base.WalkFn) error {
	keyPrefix := s.keyPrefix(prefix)
	for obj := range s.client.ListObjects(context.Background(), s.bucket, minio.ListObjectsOptions{
		Prefix:    keyPrefix,
		Recursive: true,
	}) {
		if obj.Err != nil {
			return s.wrapError(obj.Err)
		}
		// The content type is always empty here: the ListObjectsV2 response
		// has no such field. MinIO can return it through a WithMetadata
		// extension, but that is not portable to other providers.
		if err := fn(strings.TrimPrefix(obj.Key, keyPrefix), obj.ContentType); err != nil {
			return err
		}
	}
	return nil
}

func (s *s3FS) FindByPrefix(prefix base.Prefix, namePrefix string) ([]string, error) {
	keyPrefix := s.keyPrefix(prefix)
	names := []string{}
	for obj := range s.client.ListObjects(context.Background(), s.bucket, minio.ListObjectsOptions{
		Prefix:    keyPrefix + namePrefix,
		Recursive: true,
	}) {
		if obj.Err != nil {
			return nil, s.wrapError(obj.Err)
		}
		names = append(names, strings.TrimPrefix(obj.Key, keyPrefix))
	}
	return names, nil
}
