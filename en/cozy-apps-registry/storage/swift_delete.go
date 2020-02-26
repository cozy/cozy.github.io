package storage

import (
	"time"

	"github.com/hashicorp/go-multierror"
	"github.com/ncw/swift"
)

// This file is heavily inspired from
// https://github.com/cozy/cozy-stack/blob/master/model/vfs/vfsswift/swift.go

// maxNbFilesToDelete is the maximal number of files that we will try to delete
// in a single call to swift.
const maxNbFilesToDelete = 8000

// maxSimultaneousCalls is the maximal number of simultaneous calls to Swift to
// delete files in the same container.
const maxSimultaneousCalls = 8

// deleteContainer removes all the files inside the given container, and then
// deletes it.
func deleteContainer(c *swift.Connection, container string) error {
	_, _, err := c.Container(container)
	if err == swift.ContainerNotFound {
		return nil
	}
	if err != nil {
		return err
	}
	objectNames, err := c.ObjectNamesAll(container, nil)
	if err != nil {
		return err
	}
	if len(objectNames) > 0 {
		if err = deleteContainerFiles(c, container, objectNames); err != nil {
			return err
		}
	}

	// XXX Swift has told us that all the files have been deleted on the bulk
	// delete, but it only means that they have been deleted on one object
	// server (at least). And, when we try to delete the container, Swift can
	// send an error as some container servers will still have objects
	// registered for this container. We will try several times to delete the
	// container to work-around this limitation.
	return RetryWithExpBackoff(5, 2*time.Second, func() error {
		err = c.ContainerDelete(container)
		if err == swift.ContainerNotFound {
			return nil
		}
		return err
	})
}

func deleteContainerFiles(c *swift.Connection, container string, objectNames []string) error {
	nb := 1 + (len(objectNames)-1)/maxNbFilesToDelete
	ch := make(chan error)

	// Use a system of tokens to limit the number of simultaneous calls to
	// Swift: only a goroutine that has a token can make a call.
	tokens := make(chan int, maxSimultaneousCalls)
	for k := 0; k < maxSimultaneousCalls; k++ {
		tokens <- k
	}

	for i := 0; i < nb; i++ {
		begin := i * maxNbFilesToDelete
		end := (i + 1) * maxNbFilesToDelete
		if end > len(objectNames) {
			end = len(objectNames)
		}
		objectToDelete := objectNames[begin:end]
		go func() {
			k := <-tokens
			_, err := c.BulkDelete(container, objectToDelete)
			ch <- err
			tokens <- k
		}()
	}

	var errm error
	for i := 0; i < nb; i++ {
		if err := <-ch; err != nil {
			errm = multierror.Append(errm, err)
		}
	}
	// Get back the tokens to ensure that each goroutine can finish.
	for k := 0; k < maxSimultaneousCalls; k++ {
		<-tokens
	}
	return errm
}

// RetryWithExpBackoff can be used to call several times a function until it
// returns no error or the maximum count of calls has been reached. Between two
// calls, it will wait, first by the given delay, and after that, the delay
// will double after each failure.
func RetryWithExpBackoff(count int, delay time.Duration, fn func() error) error {
	err := fn()
	if err == nil {
		return nil
	}
	for i := 1; i < count; i++ {
		time.Sleep(delay)
		delay *= 2
		err = fn()
		if err == nil {
			return nil
		}
	}
	return err
}
