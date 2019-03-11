package auth

import (
	"crypto/hmac"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/asn1"
	"encoding/binary"
	"errors"
	"net/http"
	"regexp"
	"time"

	"golang.org/x/crypto/chacha20poly1305"
	"golang.org/x/crypto/scrypt"

	"github.com/cozy/cozy-apps-registry/errshttp"
)

const (
	secretLen = 32
	saltsLen  = 16
)

var (
	ErrEditorNotFound = errshttp.NewError(http.StatusNotFound, "Editor not found")
	ErrEditorExists   = errshttp.NewError(http.StatusConflict, "Editor already exists")
	ErrBadEditorName  = errshttp.NewError(http.StatusBadRequest, "Editor name should only contain alphanumeric characters")
	ErrUnauthorized   = errshttp.NewError(http.StatusUnauthorized, "Unauthorized")

	ErrMissingPassphrase = errors.New("Missing passphrase")
)

var editorReg = regexp.MustCompile("^[A-Za-z][A-Za-z0-9]*$")

const (
	pubKeyBlocType = "PUBLIC KEY"
)

type (
	EditorRegistry struct {
		Vault
	}

	Vault interface {
		GetEditor(editorName string) (*Editor, error)
		CreateEditor(editor *Editor) error
		UpdateEditor(editor *Editor) error
		DeleteEditor(editor *Editor) error
		AllEditors() ([]*Editor, error)
	}

	Editor struct {
		name               string
		editorSalt         []byte
		masterSalt         []byte
		publicKeyBytes     []byte
		publicKey          *rsa.PublicKey
		autoPublication    bool
		revocationCounters map[string]int
	}
)

func NewEditorRegistry(vault Vault) (*EditorRegistry, error) {
	return &EditorRegistry{vault}, nil
}

func CheckEditorName(editorName string) error {
	if editorName == "" || !editorReg.MatchString(editorName) {
		return ErrBadEditorName
	}
	return nil
}

func VerifyTokenAuthentication(masterSecret, token []byte) bool {
	_, ok := verifyToken(masterSecret, token, nil)
	return ok
}

func verifyToken(secret, token, additionalData []byte) ([]byte, bool) {
	if len(secret) != secretLen {
		panic("master secret has no correct length")
	}

	offset := len(token) - 32
	if offset < 0 {
		return nil, false
	}

	var expectedMac []byte
	msg, msgMac := token[:offset], token[offset:]

	{
		buf := append(additionalData, msg...)
		mac := hmac.New(sha256.New, secret)
		if _, err := mac.Write(buf); err != nil {
			return nil, false
		}
		expectedMac = mac.Sum(nil)
	}

	if !hmac.Equal(msgMac, expectedMac) {
		return nil, false
	}

	// the mac does not contain max age field
	if len(msg) < 8 {
		return nil, false
	}

	value := msg[8:]

	t := int64(binary.BigEndian.Uint64(msg))
	if t == 0 {
		return value, true
	}

	if !time.Now().UTC().Before(time.Unix(t, 0)) {
		return nil, false
	}

	return value, true
}

func generateToken(secret, msg, additionalData []byte, maxAge time.Duration) ([]byte, error) {
	if len(secret) != secretLen {
		panic("master secret has no correct length")
	}

	if maxAge < 0 {
		panic("maxAge is negative")
	}

	msg = append(make([]byte, 8), msg...)

	if maxAge > 0 {
		binary.BigEndian.PutUint64(msg, uint64(time.Now().UTC().Add(maxAge).Unix()))
	}

	var computedMac []byte
	{
		buf := append(additionalData, msg...)
		mac := hmac.New(sha256.New, secret)
		if _, err := mac.Write(buf); err != nil {
			panic(err)
		}
		computedMac = mac.Sum(nil)
	}

	msg = append(msg, computedMac...)
	return msg, nil
}

func (r *EditorRegistry) CreateEditorWithPublicKey(editorName string, publicKeyBytes []byte, autoPublication bool) (*Editor, error) {
	if err := CheckEditorName(editorName); err != nil {
		return nil, err
	}

	publicKey, err := unmarshalPublicKey(publicKeyBytes)
	if err != nil {
		return nil, err
	}

	editor := &Editor{
		name:           editorName,
		editorSalt:     readRand(saltsLen),
		masterSalt:     readRand(saltsLen),
		publicKeyBytes: publicKeyBytes,
		publicKey:      publicKey,
	}

	if err = r.CreateEditor(editor); err != nil {
		return nil, err
	}
	return editor, nil
}

func (r *EditorRegistry) CreateEditorWithoutPublicKey(editorName string, autoPublication bool) (*Editor, error) {
	if err := CheckEditorName(editorName); err != nil {
		return nil, err
	}
	editor := &Editor{
		name:            editorName,
		editorSalt:      readRand(saltsLen),
		masterSalt:      readRand(saltsLen),
		autoPublication: autoPublication,
	}
	if err := r.CreateEditor(editor); err != nil {
		return nil, err
	}
	return editor, nil
}

func (r *EditorRegistry) RevokeMasterTokens(editor *Editor) error {
	editor.masterSalt = readRand(saltsLen)
	return r.UpdateEditor(editor)
}

func (r *EditorRegistry) RevokeEditorTokens(editor *Editor) error {
	editor.editorSalt = readRand(saltsLen)
	return r.UpdateEditor(editor)
}

func DecryptMasterSecret(content, passphrase []byte) ([]byte, error) {
	var encryptedSecret struct {
		Salt   []byte
		Nonce  []byte
		Secret []byte
	}

	if len(passphrase) == 0 {
		return nil, ErrMissingPassphrase
	}

	if _, err := asn1.Unmarshal(content, &encryptedSecret); err != nil {
		return nil, err
	}
	if len(encryptedSecret.Salt) != 16 || len(encryptedSecret.Nonce) != 12 {
		return nil, errors.New("Bad secret file")
	}

	N := 16384
	r := 8
	p := 1
	derivedKey, err := scrypt.Key(passphrase, encryptedSecret.Salt, N, r, p, 32)
	if err != nil {
		return nil, err
	}

	aead, err := chacha20poly1305.New(derivedKey)
	if err != nil {
		return nil, err
	}

	secret, err := aead.Open(nil, encryptedSecret.Nonce, encryptedSecret.Secret, nil)
	if err != nil {
		return nil, err
	}

	if len(secret) != secretLen {
		return nil, errors.New("Bad secret file: bad length of secret")
	}

	return secret, nil
}

func IsSecretClear(secret []byte) bool {
	return len(secret) == secretLen
}

func EncryptMasterSecret(secret, passphrase []byte) ([]byte, error) {
	var encryptedSecret struct {
		Salt   []byte
		Nonce  []byte
		Secret []byte
	}

	if len(secret) != secretLen {
		panic("Bad len for master secret")
	}
	if len(passphrase) == 0 {
		return nil, ErrMissingPassphrase
	}

	salt := readRand(16)
	nonce := readRand(12)

	N := 16384
	r := 8
	p := 1
	derivedKey, err := scrypt.Key(passphrase, salt, N, r, p, 32)
	if err != nil {
		return nil, err
	}

	aead, err := chacha20poly1305.New(derivedKey)
	if err != nil {
		return nil, err
	}

	encrypted := aead.Seal(nil, nonce, secret, nil)
	encryptedSecret.Nonce = nonce
	encryptedSecret.Salt = salt
	encryptedSecret.Secret = encrypted

	return asn1.Marshal(encryptedSecret)
}

func GenerateMasterSecret() []byte {
	return readRand(secretLen)
}
