package registry

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"encoding/json"
	"fmt"
	"github.com/cozy/cozy-apps-registry/asset"
	"github.com/cozy/cozy-apps-registry/config"
	"github.com/ncw/swift"
	"io"
	"io/ioutil"
	"path"
	"strings"

	"github.com/go-kivik/kivik"
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
		Size:       int64(len(content)),
		PAXRecords: attrs,
	}
	if err := writer.WriteHeader(header); err != nil {
		return err
	}
	_, err := writer.Write(content)
	return err
}

func writeReaderFile(writer *tar.Writer, path string, reader io.Reader, attrs map[string]string) error {
	content, err := ioutil.ReadAll(reader)
	if err != nil {
		return err
	}
	return writeFile(writer, path, content, attrs)
}

func exportCouchDocument(writer *tar.Writer, prefix string, db *kivik.DB, rows *kivik.Rows) error {
	id := rows.ID()
	if strings.HasPrefix(id, "_design") {
		return nil
	}

	file := path.Join(prefix, fmt.Sprintf("%s%s", id, documentSuffix))
	fmt.Printf("    Exporting document %s\n", id)

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
	clean := strings.TrimPrefix(name, globalPrefix)
	if clean != name {
		clean = "__prefix__" + clean
	}

	prefix = path.Join(prefix, clean)
	fmt.Printf("  Exporting database %s\n", name)

	startKey, perPage := "", 1000
	for {
		rows, err := db.AllDocs(ctx, map[string]interface{}{
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
				startKey = rows.Key()
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
	dbs := []*kivik.DB{asset.AssetStore.DB}
	for _, c := range spaces {
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

func exportSwiftContainer(writer *tar.Writer, prefix string, connection *swift.Connection, container string) error {
	fmt.Printf("    Exporting container %s\n", container)
	prefix = path.Join(prefix, container)

	return connection.ObjectsWalk(container, nil, func(opts *swift.ObjectsOpts) (interface{}, error) {
		objects, err := connection.Objects(container, opts)
		if err != nil {
			return nil, err
		}
		for _, object := range objects {
			name := object.Name
			fmt.Printf("      Exporting object %s\n", name)

			buffer := new(bytes.Buffer)
			if _, err := connection.ObjectGet(container, name, buffer, false, nil); err != nil {
				return nil, err
			}

			file := path.Join(prefix, name)
			metadata := map[string]string{
				contentTypeAttr: object.ContentType,
			}
			if err := writeReaderFile(writer, file, buffer, metadata); err != nil {
				return nil, err
			}
		}
		return objects, nil
	})
}

func swiftContainers() []string {
	containers := []string{asset.AssetContainerName}
	for _, space := range spaces {
		container := GetPrefixOrDefault(space)
		containers = append(containers, container)
	}
	return containers
}

func exportSwift(writer *tar.Writer, prefix string) error {
	fmt.Printf("  Exporting Swift\n")
	prefix = path.Join(prefix, swiftPrefix)

	containers := swiftContainers()

	connection := config.GetConfig().SwiftConnection
	for _, container := range containers {
		if err := exportSwiftContainer(writer, prefix, connection, container); err != nil {
			return err
		}
	}

	return nil
}

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
