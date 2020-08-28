package registry

import (
	"mime"
	"net/http"
	"path"
	"strings"
)

// getMIMEType returns a MIME type for the given file (name & content). It
// first tries to sniff the MIME type from the content, and if it doesn't give
// a good result, we fallback on guessing from the filename extension.
func getMIMEType(name string, data []byte) string {
	sniffed := http.DetectContentType(data)
	// application/octet-stream is the default, when not detected
	// SVG image are often detected as text/xml or text/plain with a charset
	if sniffed != "application/octet-stream" && !strings.HasPrefix(sniffed, "text/") {
		return sniffed
	}

	ext := path.Ext(name)
	mimeParts := strings.SplitN(mime.TypeByExtension(ext), ";", 2)
	return strings.TrimSpace(mimeParts[0])
}

func stringInArray(a string, list []string) bool {
	for _, b := range list {
		if b == a {
			return true
		}
	}
	return false
}

type bytesCounter struct {
	total int64
}

func (c *bytesCounter) Write(p []byte) (int, error) {
	n := len(p)
	c.total += int64(n)
	return n, nil
}

func (c *bytesCounter) Written() int64 {
	return c.total
}
