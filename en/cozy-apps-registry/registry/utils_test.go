package registry

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetMIMEType(t *testing.T) {
	mime := getMIMEType("icon.svg", []byte(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"></svg>`))
	assert.Equal(t, "image/svg+xml", mime)
}
