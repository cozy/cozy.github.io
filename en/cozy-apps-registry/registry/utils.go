package registry

import (
	"encoding/json"
	"fmt"
)

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

type Counter struct {
	total int64
}

func (c *Counter) Write(p []byte) (int, error) {
	n := len(p)
	c.total += int64(n)
	return n, nil
}

func (c *Counter) Written() int64 {
	return c.total
}
