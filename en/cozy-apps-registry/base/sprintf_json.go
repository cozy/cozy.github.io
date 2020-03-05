package base

import (
	"encoding/json"
	"fmt"
)

// SprintfJSON can be used to generate valid JSON with a sprintf-like format.
func SprintfJSON(format string, a ...interface{}) json.RawMessage {
	for i, input := range a {
		b, err := json.Marshal(input)
		if err != nil {
			panic(err)
		}
		a[i] = string(b)
	}
	return json.RawMessage([]byte(fmt.Sprintf(format, a...)))
}
