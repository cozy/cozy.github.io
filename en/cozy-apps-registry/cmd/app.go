package cmd

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/cozy/cozy-apps-registry/auth"
	"github.com/cozy/cozy-apps-registry/config"
	"github.com/cozy/cozy-apps-registry/registry"
	"github.com/cozy/cozy-apps-registry/space"
	"github.com/spf13/cobra"
)

var lsAppsCmd = &cobra.Command{
	Use:     "ls-apps [editor]",
	Short:   `List all apps from an editor`,
	PreRunE: compose(prepareRegistry, prepareSpaces),
	RunE: func(cmd *cobra.Command, args []string) error {
		c, ok := space.GetSpace(appSpaceFlag)
		if !ok {
			return fmt.Errorf("cannot get space %s", appSpaceFlag)
		}
		db := c.AppsDB()

		editor, _, err := fetchEditor(args)
		if err != nil {
			return err
		}

		sel := map[string]interface{}{
			"editor": editor.Name(),
		}
		search := map[string]interface{}{
			"selector": sel,
			"limit":    1000,
		}

		res, err := db.Find(context.Background(), search)
		if err != nil {
			return err
		}

		var app map[string]interface{}
		var editorApps []string

		for res.Next() {
			if err := res.ScanDoc(&app); err != nil {
				return err
			}
			editorApps = append(editorApps, app["slug"].(string))
		}
		if len(editorApps) == 0 {
			return fmt.Errorf("no apps found for editor %s", editor.Name())
		}
		fmt.Println(strings.Join(editorApps, "\n"))
		return nil
	},
}

var addAppCmd = &cobra.Command{
	Use:     "add-app [slug]",
	Aliases: []string{"create-app"},
	Short:   `Add an application to the registry though an interactive CLI`,
	PreRunE: compose(prepareRegistry, prepareSpaces),
	RunE: func(cmd *cobra.Command, args []string) (err error) {
		if len(args) != 1 {
			return cmd.Help()
		}

		editor, err := auth.Editors.GetEditor(appEditorFlag)
		if err != nil {
			return err
		}

		space, ok := space.GetSpace(appSpaceFlag)
		if !ok {
			return fmt.Errorf("Space %q does not exist", appSpaceFlag)
		}

		opts := &registry.AppOptions{
			Slug:   args[0],
			Editor: appEditorFlag,
			Type:   appTypeFlag,
		}
		if appDUCFlag != "" {
			opts.DataUsageCommitment = &appDUCFlag
		}
		if appDUCByFlag != "" {
			opts.DataUsageCommitmentBy = &appDUCByFlag
		}
		if err = registry.IsValidApp(opts); err != nil {
			return err
		}

		app, err := registry.CreateApp(space, opts, editor)
		if err != nil {
			return err
		}

		b, err := json.MarshalIndent(app, "", "  ")
		if err != nil {
			return err
		}
		fmt.Println(string(b))
		return nil
	},
}

var modifyAppCmd = &cobra.Command{
	Use:     "modify-app [slug]",
	Short:   `Modify the application properties`,
	PreRunE: compose(prepareRegistry, prepareSpaces),
	RunE: func(cmd *cobra.Command, args []string) (err error) {
		if len(args) != 1 {
			return cmd.Help()
		}

		space, ok := space.GetSpace(appSpaceFlag)
		if !ok {
			return fmt.Errorf("Space %q does not exist", appSpaceFlag)
		}

		var opts registry.AppOptions
		if appDUCFlag != "" {
			opts.DataUsageCommitment = &appDUCFlag
		}
		if appDUCByFlag != "" {
			opts.DataUsageCommitmentBy = &appDUCByFlag
		}
		app, err := registry.ModifyApp(space, args[0], opts)
		if err != nil {
			return err
		}

		b, err := json.MarshalIndent(app, "", "  ")
		if err != nil {
			return err
		}
		fmt.Println(string(b))
		return nil
	},
}

var rmAppCmd = &cobra.Command{
	Use:     "rm-app [slug]",
	Short:   `Remove an application from a space`,
	PreRunE: compose(prepareRegistry, prepareSpaces),
	RunE: func(cmd *cobra.Command, args []string) (err error) {
		if len(args) != 1 {
			return cmd.Help()
		}

		space, ok := space.GetSpace(appSpaceFlag)
		if !ok {
			return fmt.Errorf("Space %q does not exist", appSpaceFlag)
		}

		return registry.RemoveAppFromSpace(space, args[0])
	},
}

var overwriteAppNameCmd = &cobra.Command{
	Use:     "overwrite-app-name [slug] [new-name]",
	Short:   `Overwrite the name of an application in a virtual space`,
	PreRunE: compose(prepareRegistry, prepareSpaces),
	RunE: func(cmd *cobra.Command, args []string) (err error) {
		if len(args) != 2 {
			return cmd.Help()
		}

		if !config.IsVirtualSpace(appSpaceFlag) {
			return fmt.Errorf("Space %q does not exist", appSpaceFlag)
		}

		return registry.OverwriteAppName(appSpaceFlag, args[0], args[1])
	},
}

var overwriteAppIconCmd = &cobra.Command{
	Use:     "overwrite-app-icon [slug] [icon-path]",
	Short:   `Overwrite the icon of an application in a virtual space`,
	PreRunE: compose(prepareRegistry, prepareSpaces),
	RunE: func(cmd *cobra.Command, args []string) (err error) {
		if len(args) != 2 {
			return cmd.Help()
		}

		if !config.IsVirtualSpace(appSpaceFlag) {
			return fmt.Errorf("Space %q does not exist", appSpaceFlag)
		}

		return registry.OverwriteAppIcon(appSpaceFlag, args[0], args[1])
	},
}

var maintenanceCmd = &cobra.Command{
	Use: "maintenance <cmd>",
	RunE: func(cmd *cobra.Command, args []string) error {
		return cmd.Help()
	},
}

var maintenanceActivateAppCmd = &cobra.Command{
	Use:     "activate [slug]",
	Short:   `Activate the maintenance for the given application slug`,
	PreRunE: compose(prepareRegistry, prepareSpaces),
	RunE: func(cmd *cobra.Command, args []string) (err error) {
		if len(args) != 1 {
			return cmd.Help()
		}
		space, ok := space.GetSpace(appSpaceFlag)
		if !ok && !config.IsVirtualSpace(appSpaceFlag) {
			return fmt.Errorf("Space %q does not exist", appSpaceFlag)
		}

		messages := make(map[string]registry.MaintenanceMessage)
		for {
			locale := prompt("Locale (empty to abort):")
			if locale == "" {
				break
			}
			if len(locale) > 5 {
				fmt.Printf("Invalid locale name: %q\n", locale)
				continue
			}
			shortMessage := prompt("Short message:")
			longMessage := prompt("Long message:")
			messages[locale] = registry.MaintenanceMessage{
				ShortMessage: shortMessage,
				LongMessage:  longMessage,
			}
		}
		opts := registry.MaintenanceOptions{
			FlagInfraMaintenance:   infraMaintenanceFlag,
			FlagShortMaintenance:   shortMaintenanceFlag,
			FlagDisallowManualExec: disallowManualExecFlag,
			Messages:               messages,
		}
		if space == nil {
			return registry.ActivateMaintenanceVirtualSpace(appSpaceFlag, args[0], opts)
		}
		return registry.ActivateMaintenanceApp(space, args[0], opts)
	},
}

var maintenanceDeactivateAppCmd = &cobra.Command{
	Use:     "deactivate [slug]",
	Short:   `Deactivate maintenance for the given application slug`,
	PreRunE: compose(prepareRegistry, prepareSpaces),
	RunE: func(cmd *cobra.Command, args []string) (err error) {
		if len(args) != 1 {
			return cmd.Help()
		}
		space, ok := space.GetSpace(appSpaceFlag)
		if !ok && !config.IsVirtualSpace(appSpaceFlag) {
			return fmt.Errorf("Space %q does not exist", appSpaceFlag)
		}

		if space == nil {
			return registry.DeactivateMaintenanceVirtualSpace(appSpaceFlag, args[0])
		}
		return registry.DeactivateMaintenanceApp(space, args[0])
	},
}
