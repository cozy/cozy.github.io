package cmd

import (
	"fmt"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/registry"
	"github.com/cozy/cozy-apps-registry/space"
	"github.com/spf13/cobra"
)

var oldVersionsCmd = &cobra.Command{
	Use:     "rm-old-versions <channel> <app>",
	Short:   "Remove old app versions",
	PreRunE: compose(prepareRegistry, prepareSpaces),
	RunE: func(cmd *cobra.Command, args []string) (err error) {
		if len(args) < 2 {
			return cmd.Usage()
		}

		channel := args[0]
		appSlug := args[1]
		space, _ := space.GetSpace(appSpaceFlag)
		run := registry.DryRun
		if noDryRunFlag {
			run = registry.RealRun
		} else {
			fmt.Println("Info: This is a dry run, the apps will not be removed")
		}
		params := base.CleanParameters{
			NbMajor:  majorFlag,
			NbMinor:  minorFlag,
			NbMonths: durationFlag,
		}
		return registry.CleanOldVersions(space, appSlug, channel, params, run)
	},
}

var rmAppVersionCmd = &cobra.Command{
	Use:     "rm-app-version <slug> <version>",
	Short:   `Deletes an app version`,
	PreRunE: compose(prepareRegistry, prepareSpaces),
	RunE: func(cmd *cobra.Command, args []string) (err error) {
		if len(args) != 2 {
			return cmd.Help()
		}
		space, ok := space.GetSpace(appSpaceFlag)
		if !ok {
			return fmt.Errorf("Space %q does not exist", appSpaceFlag)
		}

		slug := args[0]
		version := args[1]

		ver, err := registry.FindVersion(space, slug, version)
		if err != nil {
			return err
		}
		return ver.Delete(space)
	},
}
