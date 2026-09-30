// Package testutils holds helpers shared by the test suites of several
// packages.
package testutils

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// MinioBucket connects to the MinIO server the tests use and returns a client
// with a bucket of its own, emptied and removed when the test ends.
//
// It skips the test when no server answers, so that `make tests` stays usable
// on a development environment without MinIO. CI sets MINIO_REQUIRED, which
// turns that skip into a failure: `make tests` does not run go test in verbose
// mode, so an unnoticed skip would leave the build green while covering
// nothing.
func MinioBucket(t *testing.T) (*minio.Client, string) {
	t.Helper()

	endpoint := envOr("MINIO_ENDPOINT", "localhost:9000")
	client, err := minio.New(endpoint, &minio.Options{
		Creds: credentials.NewStaticV4(
			envOr("MINIO_ACCESS_KEY", "minioadmin"),
			envOr("MINIO_SECRET_KEY", "minioadmin"),
			"",
		),
		Secure: false,
	})
	if err != nil {
		t.Fatalf("Cannot create the S3 client: %s", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if _, err := client.ListBuckets(ctx); err != nil {
		if os.Getenv("MINIO_REQUIRED") != "" {
			t.Fatalf("MINIO_REQUIRED is set but no S3 server answers on %s: %s", endpoint, err)
		}
		t.Skipf("No S3 server reachable on %s: %s", endpoint, err)
	}

	bucket := fmt.Sprintf("registry-test-%d", time.Now().UnixNano())
	if err := client.MakeBucket(context.Background(), bucket, minio.MakeBucketOptions{}); err != nil {
		t.Fatalf("Cannot create the test bucket %s: %s", bucket, err)
	}
	t.Cleanup(func() { removeBucket(t, client, bucket) })

	return client, bucket
}

func removeBucket(t *testing.T, client *minio.Client, bucket string) {
	ctx := context.Background()
	objects := client.ListObjects(ctx, bucket, minio.ListObjectsOptions{Recursive: true})
	for e := range client.RemoveObjects(ctx, bucket, objects, minio.RemoveObjectsOptions{}) {
		t.Logf("Cannot remove object %s from bucket %s: %s", e.ObjectName, bucket, e.Err)
	}
	if err := client.RemoveBucket(ctx, bucket); err != nil {
		t.Logf("Cannot remove the test bucket %s: %s", bucket, err)
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
