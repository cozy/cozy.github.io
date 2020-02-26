// Cozy-apps-registry is a web service that allows to list web applications and
// connectors that can be installed on a cozy instance.
package main

import (
	"fmt"
	"os"

	"github.com/cozy/cozy-apps-registry/cmd"
)

func main() {
	if err := cmd.Root().Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %s\n", err.Error())
		os.Exit(1)
	}
}
