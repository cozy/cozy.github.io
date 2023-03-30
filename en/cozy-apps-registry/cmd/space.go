package cmd

import (
	"fmt"
	"log"
	"strings"

	"github.com/cozy/cozy-apps-registry/config"
	"github.com/cozy/cozy-apps-registry/registry"
	"github.com/cozy/cozy-apps-registry/space"
	"github.com/spf13/cobra"
)

var rmSpaceCmd = &cobra.Command{
	Use:     "rm-space <space>",
	Short:   `Removes a space`,
	Long:    `Removes a space, its applications and versions from the registry`,
	PreRunE: compose(prepareRegistry, prepareSpaces),
	RunE: func(cmd *cobra.Command, args []string) error {
		if len(args) != 1 {
			return cmd.Usage()
		}
		spaceName := args[0]

		if config.IsVirtualSpace(spaceName) {
			return fmt.Errorf("%q is a virtual space, just remove the entry from your config file", spaceName)
		}

		s, ok := space.GetSpace(spaceName)
		if !ok {
			return fmt.Errorf("cannot find space %q", spaceName)
		}

		if !forceFlag {
			fmt.Printf("Warning: You are going to remove space %s and all its applications. This action is irreversible.\nPlease enter the space name to confirm: ", spaceName)
			var response string
			_, err := fmt.Scanln(&response)
			if err != nil {
				log.Fatal(err)
			}

			if response != args[0] {
				return fmt.Errorf("space names are not identical")
			}
		}

		// Removing the space
		return registry.RemoveSpace(s)
	},
}

var lsSpaceCmd = &cobra.Command{
	Use:     "ls-spaces",
	Short:   `List spaces`,
	Long:    `List all configured spaces`,
	PreRunE: prepareRegistry,
	RunE: func(cmd *cobra.Command, args []string) error {
		var physicalSpaceList []string
		var virtualSpaceList []string

		if physicalFlag || !virtualFlag {
			physicalSpaceList = config.GetSpaces()
		}
		if virtualFlag || !physicalFlag {
			virtualSpaceList = config.GetVirtualSpaces()
		}

		if !withSpaceTypeFlag {
			fmt.Println(strings.Join(append(physicalSpaceList, virtualSpaceList...), "\n"))
		} else {
			for _, sp := range physicalSpaceList {
				fmt.Println("physical", sp)
			}
			for _, sp := range virtualSpaceList {
				fmt.Println("virtual", sp)
			}
		}

		return nil
	},
}
