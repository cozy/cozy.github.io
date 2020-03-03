package registry

import (
	"encoding/json"
	"fmt"
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
	if sniffed != "application/octet-stream" && sniffed != "text/plain" {
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

func sprintfJSON(format string, a ...interface{}) json.RawMessage {
	for i, input := range a {
		b, err := json.Marshal(input)
		if err != nil {
			panic(err)
		}
		a[i] = string(b)
	}
	return json.RawMessage([]byte(fmt.Sprintf(format, a...)))
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
