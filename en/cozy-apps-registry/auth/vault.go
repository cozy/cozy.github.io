package auth

import (
	"context"
	"strings"

	"github.com/go-kivik/kivik"
)

type couchdbVault struct {
	db  *kivik.DB
	ctx context.Context
}

type editorForCouchdb struct {
	ID                 string         `json:"_id,omitempty"`
	Rev                string         `json:"_rev,omitempty"`
	Name               string         `json:"name"`
	EditorSalt         []byte         `json:"session_secret_salt"`
	MasterSalt         []byte         `json:"master_secret_salt"`
	PublicKeyBytes     []byte         `json:"public_key"`
	AutoPublication    bool           `json:"auto_publication"`
	RevocationCounters map[string]int `json:"revocation_counters,omitempty"`
}

func NewCouchDBVault(db *kivik.DB) Vault {
	ctx := context.Background()
	return &couchdbVault{db, ctx}
}

func (r *couchdbVault) GetEditor(editorName string) (*Editor, error) {
	if err := CheckEditorName(editorName); err != nil {
		return nil, err
	}
	e, err := r.getEditor(editorName)
	if err != nil {
		return nil, err
	}
	editor := &Editor{
		name:               e.Name,
		editorSalt:         e.EditorSalt,
		masterSalt:         e.MasterSalt,
		publicKeyBytes:     e.PublicKeyBytes,
		autoPublication:    e.AutoPublication,
		revocationCounters: e.RevocationCounters,
	}
	var needUpdate bool
	if len(editor.masterSalt) == 0 {
		editor.masterSalt = readRand(saltsLen)
		needUpdate = true
	}
	if len(editor.editorSalt) == 0 {
		editor.editorSalt = readRand(saltsLen)
		needUpdate = true
	}
	if needUpdate {
		if err = r.UpdateEditor(editor); err != nil {
			return nil, err
		}
	}
	return editor, nil
}

func (r *couchdbVault) CreateEditor(editor *Editor) error {
	_, err := r.getEditor(editor.name)
	if err == nil {
		return ErrEditorExists
	}
	if err != ErrEditorNotFound {
		return err
	}
	_, _, err = r.db.CreateDoc(r.ctx, &editorForCouchdb{
		ID:                 strings.ToLower(editor.name),
		Name:               editor.name,
		EditorSalt:         editor.editorSalt,
		MasterSalt:         editor.masterSalt,
		PublicKeyBytes:     editor.publicKeyBytes,
		AutoPublication:    editor.autoPublication,
		RevocationCounters: editor.revocationCounters,
	})
	return err
}

func (r *couchdbVault) UpdateEditor(editor *Editor) error {
	e, err := r.getEditor(editor.name)
	if err != nil {
		return err
	}
	_, err = r.db.Put(r.ctx, e.ID, &editorForCouchdb{
		ID:                 e.ID,
		Rev:                e.Rev,
		Name:               editor.name,
		EditorSalt:         editor.editorSalt,
		MasterSalt:         editor.masterSalt,
		PublicKeyBytes:     editor.publicKeyBytes,
		AutoPublication:    editor.autoPublication,
		RevocationCounters: editor.revocationCounters,
	})
	return err
}

func (r *couchdbVault) DeleteEditor(editor *Editor) error {
	e, err := r.getEditor(editor.name)
	if err != nil {
		return err
	}
	_, err = r.db.Delete(r.ctx, e.ID, e.Rev)
	return err
}

func (r *couchdbVault) AllEditors() ([]*Editor, error) {
	rows, err := r.db.AllDocs(r.ctx, map[string]interface{}{
		"include_docs": true,
		"limit":        2000,
	})
	if err != nil {
		return nil, err
	}
	editors := make([]*Editor, 0)
	for rows.Next() {
		if strings.HasPrefix(rows.ID(), "_design") {
			continue
		}
		var e editorForCouchdb
		if err = rows.ScanDoc(&e); err != nil {
			return nil, err
		}
		editors = append(editors, &Editor{
			name:               e.Name,
			editorSalt:         e.EditorSalt,
			masterSalt:         e.MasterSalt,
			publicKeyBytes:     e.PublicKeyBytes,
			autoPublication:    e.AutoPublication,
			revocationCounters: e.RevocationCounters,
		})
	}
	return editors, nil
}

func (r *couchdbVault) getEditor(editorName string) (*editorForCouchdb, error) {
	editorID := strings.ToLower(editorName)
	row := r.db.Get(r.ctx, editorID)
	var doc editorForCouchdb
	if err := row.ScanDoc(&doc); err != nil {
		if kivik.StatusCode(err) == kivik.StatusNotFound {
			return nil, ErrEditorNotFound
		}
		return nil, err
	}
	return &doc, nil
}
