package export

import (
	"archive/tar"
	"compress/gzip"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"path"
	"strings"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/config"
	"github.com/cozy/cozy-apps-registry/space"
	"github.com/pbenner/threadpool"
)

type couchDb struct {
	db        string
	documents []interface{}
}
type couchDbs map[string]*couchDb

func (db *couchDb) bulkImport() error {
	docs := db.documents
	if len(docs) == 0 {
		return nil
	}
	fmt.Printf("Bulk import %d CouchDB documents into %s\n", len(docs), db.db)

	ctx := context.Background()
	c := base.DBClient.DB(ctx, db.db)
	_, err := c.BulkDocs(ctx, docs)
	if err != nil {
		return err
	}
	db.documents = db.documents[:0]
	return nil
}

func (db *couchDb) add(doc interface{}) error {
	docs := db.documents
	docs = append(docs, doc)
	db.documents = docs
	if len(docs) >= 1000 {
		return db.bulkImport()
	}
	return nil
}

func (dbs couchDbs) add(name string, doc interface{}) error {
	db := dbs[name]
	if db == nil {
		db = &couchDb{name, make([]interface{}, 0)}
		dbs[name] = db
	}
	return db.add(doc)
}

func (dbs couchDbs) flush() error {
	for _, db := range dbs {
		if err := db.bulkImport(); err != nil {
			return err
		}
	}
	return nil
}

func cleanCouch() error {
	fmt.Printf("Clean CouchDB\n")
	for _, db := range couchDatabases() {
		name := db.Name()
		fmt.Printf("  Clean CouchDB %s\n", name)
		if err := base.DBClient.DestroyDB(context.Background(), name); err != nil {
			return err
		}
	}

	if err := config.PrepareSpaces(); err != nil {
		return err
	}

	return space.InitializeSpaces()
}

func parseCouchDocument(reader io.Reader, parts []string) (string, *interface{}, error) {
	db, id := parts[0], parts[1]
	db = strings.Replace(db, "__prefix__", base.DatabaseNamespace, 1)
	id = strings.TrimSuffix(id, documentSuffix)
	fmt.Printf("Parse CouchDB document %s.%s\n", db, id)

	var doc interface{}
	if err := json.NewDecoder(reader).Decode(&doc); err != nil {
		return "", nil, err
	}

	return db, &doc, nil
}

func cleanSwift() error {
	for _, container := range swiftContainers() {
		if err := base.Storage.EnsureEmpty(container); err != nil {
			return err
		}
	}

	return nil
}

func importSwift(reader io.Reader, header *tar.Header, parts []string, pool threadpool.ThreadPool, group int) error {
	container, parts := base.Prefix(parts[0]), parts[1:]
	path := path.Join(parts...)
	contentType := header.PAXRecords[contentTypeAttr]
	fmt.Printf("Import Swift document %s %s\n", container, path)

	return pool.AddJob(group, func(pool threadpool.ThreadPool, erf func() error) error {
		return base.Storage.Create(container, path, contentType, reader)
	})
}

// Drop can be used to clean CouchDB and Swift before importing a tarball.
func Drop() error {
	if err := cleanCouch(); err != nil {
		return err
	}
	return cleanSwift()
}

// Import will create the couchDB documents and Swift files from a tarball.
func Import(reader io.Reader) (err error) {
	zr, err := gzip.NewReader(reader)
	if err != nil {
		return err
	}
	defer func() {
		if e := zr.Close(); e != nil && err == nil {
			err = e
		}
	}()
	tr := tar.NewReader(zr)

	pool := threadpool.New(10, 10)
	swiftGroup := pool.NewJobGroup()

	dbs := couchDbs{}
	for {
		header, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		name := header.Name
		parts := strings.Split(name, "/")
		prefix, parts := parts[0], parts[1:]
		if prefix != rootPrefix {
			continue
		}

		prefix, parts = parts[0], parts[1:]
		switch prefix {
		case couchPrefix:
			if len(parts) > 2 {
				// Skip attachments
				continue
			}
			db, doc, err := parseCouchDocument(tr, parts)
			if err != nil {
				return err
			}
			if err := dbs.add(db, doc); err != nil {
				return err
			}
		case swiftPrefix:
			if err := importSwift(tr, header, parts, pool, swiftGroup); err != nil {
				return err
			}
		}
	}

	if err := pool.Wait(swiftGroup); err != nil {
		return err
	}

	return dbs.flush()
}
