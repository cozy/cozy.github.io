package storage

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/minio/minio-go/v7"
)

// This file is adapted from
// https://github.com/cozy/cozy-stack/blob/master/pkg/s3util/s3util.go

// bucketOpTimeout bounds the bucket operations made when the storage is set
// up, so that an unreachable endpoint fails the start-up instead of hanging.
const bucketOpTimeout = 30 * time.Second

// PrepareBucket makes sure the bucket can be used before the registry starts
// serving: it creates it when autoCreate is set, and only checks that it is
// reachable otherwise.
func PrepareBucket(client *minio.Client, bucket, region string, autoCreate bool) error {
	ctx := context.Background()
	if autoCreate {
		return ensureBucket(ctx, client, bucket, region)
	}
	return checkBucket(ctx, client, bucket)
}

// isS3NotFound returns true when the error is an S3 "not found" response.
func isS3NotFound(err error) bool {
	code := minio.ToErrorResponse(err).Code
	return code == "NoSuchKey" || code == "NoSuchBucket"
}

// checkBucket verifies that the bucket is reachable and usable, without
// listing or creating any bucket.
//
// The errors it returns never wrap the provider's own error: those can echo
// the access key or the details of a signed request, and this runs at start-up
// where the message goes straight to the logs.
func checkBucket(ctx context.Context, client *minio.Client, bucket string) error {
	ctx, cancel := context.WithTimeout(ctx, bucketOpTimeout)
	defer cancel()

	creds, err := client.GetCreds()
	if err != nil || creds.AccessKeyID == "" || creds.SecretAccessKey == "" {
		return fmt.Errorf("s3: no usable credentials for bucket %q", bucket)
	}
	exists, err := client.BucketExists(ctx, bucket)
	if err != nil {
		return fmt.Errorf("s3: bucket %q is inaccessible, check the endpoint, the credentials and the permissions", bucket)
	}
	if !exists {
		return fmt.Errorf("s3: bucket %q does not exist", bucket)
	}
	return nil
}

// ensureBucket creates the bucket if it does not already exist.
func ensureBucket(ctx context.Context, client *minio.Client, bucket, region string) error {
	ctx, cancel := context.WithTimeout(ctx, bucketOpTimeout)
	defer cancel()

	err := client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{Region: region})
	if err != nil {
		switch minio.ToErrorResponse(err).Code {
		case "BucketAlreadyOwnedByYou", "BucketAlreadyExists":
			return nil
		}
		return fmt.Errorf("s3: cannot create bucket %q, check the endpoint, the credentials and the permissions", bucket)
	}
	return nil
}

// deletePrefixObjects deletes every object of a bucket under the given key
// prefix. It is what stands in for deleting a container: S3 has no such
// object, only the keys below the prefix.
func deletePrefixObjects(ctx context.Context, client *minio.Client, bucket, prefix string) error {
	objectsCh := make(chan minio.ObjectInfo)
	var listErr error
	go func() {
		// Closing the channel is what lets RemoveObjects finish, and it also
		// publishes listErr to the reader below.
		defer close(objectsCh)
		for obj := range client.ListObjects(ctx, bucket, minio.ListObjectsOptions{
			Prefix:    prefix,
			Recursive: true,
		}) {
			if obj.Err != nil {
				listErr = obj.Err
				return
			}
			objectsCh <- obj
		}
	}()

	var errm error
	for e := range client.RemoveObjects(ctx, bucket, objectsCh, minio.RemoveObjectsOptions{}) {
		errm = errors.Join(errm, e.Err)
	}
	if listErr != nil {
		return listErr
	}
	return errm
}
