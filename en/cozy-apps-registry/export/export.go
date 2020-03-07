package export

import (
	"archive/tar"
	"compress/gzip"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"path"
	"strings"
	"time"

	"github.com/cozy/cozy-apps-registry/asset"
	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/space"
	"github.com/go-kivik/kivik/v3"
	"golang.org/x/sync/errgroup"
)

const rootPrefix = "registry"
const couchPrefix = "couchdb"
const swiftPrefix = "swift"
const documentSuffix = ".json"
const contentTypeAttr = "COZY.content-type"

func writeFile(writer *tar.Writer, path string, content []byte, attrs map[string]string) error {
	header := &tar.Header{
		Typeflag:   tar.TypeReg,
		Name:       path,
		Mode:       0640,
		ModTime:    time.Now(),
		Size:       int64(len(content)),
		PAXRecords: attrs,
	}
	if err := writer.WriteHeader(header); err != nil {
		return err
	}
	_, err := writer.Write(content)
	return err
}

func exportCouchDocument(writer *tar.Writer, prefix string, db *kivik.DB, rows *kivik.Rows) error {
	id := rows.ID()
	if strings.HasPrefix(id, "_design") {
		return nil
	}

	file := path.Join(prefix, fmt.Sprintf("%s%s", id, documentSuffix))

	var value map[string]interface{}
	if err := rows.ScanDoc(&value); err != nil {
		return err
	}

	delete(value, "_rev")
	delete(value, "_attachments")

	var data []byte
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return writeFile(writer, file, data, nil)
}

func exportSingleCouchDb(writer *tar.Writer, prefix string, db *kivik.DB) error {
	name := db.Name()
	clean := strings.Replace(name, base.DatabaseNamespace, "__prefix__", 1)

	prefix = path.Join(prefix, clean)
	fmt.Printf("  Exporting database %s\n", name)

	startKey, perPage := "", 1000
	for {
		rows, err := db.AllDocs(context.Background(), map[string]interface{}{
			"include_docs": true,
			"limit":        perPage + 1,
			"start_key":    startKey,
		})
		if err != nil {
			return err
		}

		startKey = ""
		i := 0
		for rows.Next() {
			if i == perPage {
				startKey = rows.ID()
				break
			}
			if err := exportCouchDocument(writer, prefix, db, rows); err != nil {
				return err
			}
			i++
		}
		if startKey == "" {
			break
		}
	}

	return nil
}

func couchDatabases() []*kivik.DB {
	dbs := []*kivik.DB{base.GlobalAssetStore.GetDB()}
	for _, c := range space.Spaces {
		dbs = append(dbs, c.DBs()...)
	}
	return dbs
}

func exportAllCouchDbs(writer *tar.Writer, prefix string) error {
	fmt.Printf("  Exporting CouchDB\n")
	prefix = path.Join(prefix, couchPrefix)

	dbs := couchDatabases()
	for _, db := range dbs {
		if err := exportSingleCouchDb(writer, prefix, db); err != nil {
			return err
		}
	}

	return nil
}

func exportSwiftContainer(writer *tar.Writer, prefix string, container base.Prefix) error {
	fmt.Printf("    Exporting container %s\n", container)
	dir := path.Join(prefix, container.String())
	g, ctx := errgroup.WithContext(context.Background())

	toRead := make(chan entry)
	g.Go(func() error {
		defer close(toRead)
		return base.Storage.Walk(container, func(name, contentType string) error {
			e := entry{name: name, contentType: contentType}
			select {
			case toRead <- e:
			case <-ctx.Done():
				return ctx.Err()
			}
			return nil
		})
	})

	// Start a fixed number of goroutines to read files.
	toWrite := make(chan entry)
	const numReaders = 10
	for i := 0; i < numReaders; i++ {
		g.Go(func() error {
			for entry := range toRead {
				reader, _, err := base.Storage.Get(container, entry.name)
				if err != nil {
					return err
				}
				content, err := ioutil.ReadAll(reader)
				if err != nil {
					return err
				}
				entry.content = content
				toWrite <- entry
			}
			return nil
		})
	}
	go func() {
		_ = g.Wait()
		close(toWrite)
	}()

	for entry := range toWrite {
		file := path.Join(dir, entry.name)
		metadata := map[string]string{
			contentTypeAttr: entry.contentType,
		}
		if err := writeFile(writer, file, entry.content, metadata); err != nil {
			return err
		}
	}

	return g.Wait()
}

func swiftContainers() []base.Prefix {
	containers := []base.Prefix{asset.AssetContainerName}
	for _, space := range space.Spaces {
		container := space.GetPrefix()
		containers = append(containers, container)
	}
	return containers
}

func exportSwift(writer *tar.Writer, prefix string) error {
	fmt.Printf("  Exporting Swift\n")
	prefix = path.Join(prefix, swiftPrefix)
	containers := swiftContainers()

	for _, container := range containers {
		if err := exportSwiftContainer(writer, prefix, container); err != nil {
			return err
		}
	}

	return nil
}

// Export creates a tarball with the CouchDB documents and Swift files.
func Export(writer io.Writer) (err error) {
	zw := gzip.NewWriter(writer)
	defer func() {
		if e := zw.Close(); e != nil && err == nil {
			err = e
		}
	}()
	tw := tar.NewWriter(zw)
	defer func() {
		if e := tw.Close(); e != nil && err == nil {
			err = e
		}
	}()

	if err := exportAllCouchDbs(tw, rootPrefix); err != nil {
		return err
	}
	return exportSwift(tw, rootPrefix)
}
