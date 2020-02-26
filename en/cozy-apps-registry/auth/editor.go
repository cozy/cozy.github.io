package auth

import (
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"
	"time"

	"golang.org/x/crypto/hkdf"
)

type tokenData struct {
	App string `json:"app"`
}

func (t *tokenData) UnmarshalJSON(data []byte) error {
	var v struct {
		Apps []string `json:"apps"` // retro-compat
		App  string   `json:"app"`
	}
	if err := json.Unmarshal(data, &v); err != nil {
		return err
	}
	if len(v.Apps) > 0 {
		t.App = v.Apps[0]
	} else {
		t.App = v.App
	}
	return nil
}

func (e *Editor) MarshalJSON() ([]byte, error) {
	v := struct {
		Name string `json:"name"`
	}{
		Name: e.name,
	}
	return json.Marshal(v)
}

func (e *Editor) Name() string {
	return e.name
}

func (e *Editor) AutoPublication() bool {
	return e.autoPublication
}

func (e *Editor) IsComplete() bool {
	return len(e.name) > 0 && len(e.editorSalt) == saltsLen
}

func (e *Editor) GenerateMasterToken(masterSecret []byte, maxAge time.Duration) ([]byte, error) {
	editorSecret, err := e.derivateSecret(masterSecret, e.masterSalt)
	if err != nil {
		return nil, err
	}
	token, err := generateToken(editorSecret, nil, nil, 0)
	if err != nil {
		return nil, err
	}
	return generateToken(masterSecret, token, nil, maxAge)
}

func (e *Editor) VerifyMasterToken(masterSecret, token []byte) bool {
	value, ok := verifyToken(masterSecret, token, nil)
	if !ok {
		return false
	}
	sessionSecret, err := e.derivateSecret(masterSecret, e.masterSalt)
	if err != nil {
		return false
	}
	_, ok = verifyToken(sessionSecret, value, nil)
	return ok
}

func (e *Editor) GenerateEditorToken(masterSecret []byte, maxAge time.Duration, appName string) ([]byte, error) {
	if appName == "" {
		return nil, fmt.Errorf("Could not generate editor token without application name")
	}
	sessionSecret, err := e.derivateSecret(masterSecret, e.editorSalt)
	if err != nil {
		return nil, err
	}
	var data []byte
	data, err = json.Marshal(tokenData{App: appName})
	if err != nil {
		return nil, err
	}
	token, err := generateToken(sessionSecret, data, e.additionalData(appName), 0)
	if err != nil {
		return nil, err
	}
	return generateToken(masterSecret, token, nil, maxAge)
}

func (e *Editor) VerifyEditorToken(masterSecret, token []byte, appName string) bool {
	if appName == "" {
		panic(errors.New("Could not verify token: empty application name"))
	}
	value, ok := verifyToken(masterSecret, token, nil)
	if !ok {
		return false
	}
	sessionSecret, err := e.derivateSecret(masterSecret, e.editorSalt)
	if err != nil {
		return false
	}
	var data []byte
	data, ok = verifyToken(sessionSecret, value, e.additionalData(appName))
	if !ok {
		return false
	}
	var v tokenData
	if len(data) > 0 {
		if err = json.Unmarshal(data, &v); err != nil {
			return false
		}
	}
	if v.App == "" {
		return true
	}
	return appName == v.App
}

func (e *Editor) additionalData(appName string) []byte {
	editorName := strings.ToLower(e.name)
	if counter, ok := e.revocationCounters[appName]; ok && counter > 0 {
		editorName += fmt.Sprintf(";counter=%d", counter)
	}
	return []byte(editorName)
}

func (e *Editor) derivateSecret(masterSecret, salt []byte) ([]byte, error) {
	if len(masterSecret) != secretLen {
		panic("master secret has no correct length")
	}

	kdf := hkdf.New(sha256.New, masterSecret, salt, []byte(e.name))
	sessionSecret := make([]byte, secretLen)
	_, err := io.ReadFull(kdf, sessionSecret)
	if err != nil {
		return nil, err
	}

	return sessionSecret, nil
}
