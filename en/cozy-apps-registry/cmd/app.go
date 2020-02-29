package cmd

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/cozy/cozy-apps-registry/auth"
	"github.com/cozy/cozy-apps-registry/registry"
	"github.com/spf13/cobra"
)

var lsAppsCmd = &cobra.Command{
	Use:     "ls-apps [editor]",
	Short:   `List all apps from an editor`,
	PreRunE: compose(prepareRegistry, prepareSpaces),
	RunE: func(cmd *cobra.Command, args []string) error {
		c, ok := registry.GetSpace(appSpaceFlag)
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
		var editors []string

		for res.Next() {
			if err := res.ScanDoc(&app); err != nil {
				return err
			}
			editors = append(editors, app["slug"].(string))
		}
		if len(editors) == 0 {
			return fmt.Errorf("no apps found for editor %s", editor.Name())
		}
		fmt.Println(strings.Join(editors, ", "))
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

		space, ok := registry.GetSpace(appSpaceFlag)
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

		space, ok := registry.GetSpace(appSpaceFlag)
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
		space, ok := registry.GetSpace(appSpaceFlag)
		if !ok {
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
		space, ok := registry.GetSpace(appSpaceFlag)
		if !ok {
			return fmt.Errorf("Space %q does not exist", appSpaceFlag)
		}
		return registry.DeactivateMaintenanceApp(space, args[0])
	},
}
