package auth

import (
	"bytes"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/binary"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"math/big"
)

func unmarshalPublicKey(publicKeyBytes []byte) (*rsa.PublicKey, error) {
	var publicKey *rsa.PublicKey

	if bytes.HasPrefix(publicKeyBytes, []byte("ssh-rsa ")) {
		sshFields := bytes.Fields(publicKeyBytes)
		if len(sshFields) < 2 {
			return nil, fmt.Errorf("Failed to parse SSH public key file")
		}
		var ok bool
		publicKey, ok = unmarshalSSHPublicRSAKey(sshFields[1])
		if !ok {
			return nil, fmt.Errorf("Failed to parse SSH public key file")
		}
	} else {
		if bytes.HasPrefix(publicKeyBytes, []byte("-----BEGIN")) {
			block, _ := pem.Decode(publicKeyBytes)
			if block == nil {
				return nil, fmt.Errorf("Failed to parse PEM block containing the public key")
			}
			if block.Type != pubKeyBlocType {
				return nil, fmt.Errorf(`Bad PEM block type, got "%s" expecting "%s"`,
					block.Type, pubKeyBlocType)
			}
			publicKeyBytes = block.Bytes
		}

		untypedPublicKey, err := x509.ParsePKIXPublicKey(publicKeyBytes)
		if err != nil {
			return nil, err
		}

		var ok bool
		publicKey, ok = untypedPublicKey.(*rsa.PublicKey)
		if !ok {
			return nil, errors.New("Not supported public key type: only RSA is supported")
		}
	}

	if bitLen := publicKey.N.BitLen(); bitLen < 2048 {
		return nil, fmt.Errorf("Public key length is too small: %d bits (expecting at least %d bits)", bitLen, 2048)
	}

	return publicKey, nil
}

func unmarshalSSHPublicRSAKey(encoded []byte) (key *rsa.PublicKey, ok bool) {
	data, err := base64.StdEncoding.DecodeString(string(encoded))
	if err != nil {
		return
	}

	var readok bool
	var algo []byte
	algo, data, readok = readSSHMessage(data)
	if !readok || string(algo) != "ssh-rsa" {
		return
	}

	e := new(big.Int)
	n := new(big.Int)

	var buf []byte
	buf, data, readok = readSSHMessage(data)
	if !readok {
		return
	}
	e.SetBytes(buf)

	exp := int(e.Int64())
	if exp < 2 || exp > 1<<31-1 {
		return
	}

	buf, data, readok = readSSHMessage(data)
	if !readok || len(data) != 0 {
		return
	}

	n.SetBytes(buf)

	key = new(rsa.PublicKey)
	key.E = exp
	key.N = n
	ok = true
	return
}

func readSSHMessage(in []byte) (out []byte, rest []byte, ok bool) {
	if len(in) < 4 {
		return
	}
	length := binary.BigEndian.Uint32(in)
	in = in[4:]
	if uint32(len(in)) < length {
		return
	}
	out = in[:length]
	rest = in[length:]
	ok = true
	return
}

func readRand(n int) []byte {
	b := make([]byte, n)
	_, err := io.ReadFull(rand.Reader, b)
	if err != nil {
		panic(err)
	}
	return b
}
