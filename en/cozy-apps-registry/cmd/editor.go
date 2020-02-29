package cmd

import (
	"fmt"
	"os"

	"github.com/cozy/cozy-apps-registry/auth"
	"github.com/spf13/cobra"
)

var addEditorCmd = &cobra.Command{
	Use:     "add-editor [editor]",
	Short:   `Add an editor to the registry though an interactive CLI`,
	PreRunE: prepareRegistry,
	RunE: func(cmd *cobra.Command, args []string) (err error) {
		var editorName string
		for {
			editorName, _, err = getEditorName(args)
			if err != nil {
				return err
			}
			_, err = auth.Editors.GetEditor(editorName)
			if err == nil {
				if len(args) > 0 {
					return auth.ErrEditorExists
				}
				fmt.Fprintln(os.Stderr, auth.ErrEditorExists)
				continue
			}
			break
		}

		fmt.Printf("Creating new editor %q...", editorName)
		_, err = auth.Editors.CreateEditorWithoutPublicKey(editorName, editorAutoPublicationFlag)
		if err != nil {
			fmt.Println("failed")
			return err
		}

		fmt.Println("ok")
		return nil
	},
}

var rmEditorCmd = &cobra.Command{
	Use:     "rm-editor [editor]",
	Aliases: []string{"delete-editor", "remove-editor"},
	Short:   `Remove an editor from the registry though an interactive CLI`,
	PreRunE: prepareRegistry,
	RunE: func(cmd *cobra.Command, args []string) error {
		editor, _, err := fetchEditor(args)
		if err != nil {
			return err
		}

		fmt.Printf("Deleting editor %q...", editor.Name())
		err = auth.Editors.DeleteEditor(editor)
		if err != nil {
			fmt.Println("failed")
			return err
		}

		fmt.Println("ok")
		return nil
	},
}

var lsEditorsCmd = &cobra.Command{
	Use:     "ls-editors",
	Aliases: []string{"ls-editor", "list-editor", "list-editors"},
	Short:   `List all editors from registry`,
	PreRunE: prepareRegistry,
	RunE: func(cmd *cobra.Command, args []string) error {
		editors, err := auth.Editors.AllEditors()
		if err != nil {
			return err
		}
		for _, editor := range editors {
			fmt.Println(editor.Name())
		}
		return nil
	},
}

func getEditorName(args []string) (editorName string, rest []string, err error) {
	if len(args) > 0 {
		editorName, rest = args[0], args[1:]
		err = auth.CheckEditorName(editorName)
		return
	}
	for {
		editorName = prompt("Editor name:")
		if err = auth.CheckEditorName(editorName); err != nil {
			fmt.Fprintf(os.Stderr, "%s\n", err.Error())
			continue
		}
		return
	}
}

func fetchEditor(args []string) (editor *auth.Editor, rest []string, err error) {
	var editorName string
	editorName, rest, err = getEditorName(args)
	if err != nil {
		return
	}
	editor, err = auth.Editors.GetEditor(editorName)
	if err != nil {
		err = fmt.Errorf("Error while getting editor: %s", err)
	}
	return
}
