package cmd

import (
	"fmt"
	"log"

	"github.com/cozy/cozy-apps-registry/registry"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
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
		space := args[0]

		// Check the space is not a virtual one
		for _, vkey := range getVspaceKeys(viper.GetStringMap("virtual_spaces")) {
			if space == vkey {
				return fmt.Errorf("%q is a virtual space, just remove the entry from your config file", space)
			}
		}

		s, ok := registry.GetSpace(space)
		if !ok {
			return fmt.Errorf("cannot find space %q", space)
		}

		if !forceFlag {
			fmt.Printf("Warning: You are going to remove space %s and all its applications. This action is irreversible.\nPlease enter the space name to confirm: ", space)
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
