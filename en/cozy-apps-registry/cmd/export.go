package cmd

import (
	"fmt"
	"io"
	"os"

	"github.com/cozy/cozy-apps-registry/export"
	"github.com/spf13/cobra"
)

var exportCmd = &cobra.Command{
	Use:     "export [file]",
	Short:   `Export the entire registry into one tarball file`,
	PreRunE: compose(prepareRegistry, prepareSpaces),
	RunE: func(cmd *cobra.Command, args []string) (err error) {
		var out io.Writer
		if len(args) > 0 {
			filename := args[0]
			file, err := os.OpenFile(filename, os.O_WRONLY|os.O_CREATE, 0600)
			if err != nil {
				return err
			}
			defer func() {
				if e := file.Close(); e != nil && err == nil {
					err = e
				}
			}()
			out = file
		} else {
			out = os.Stdout
		}
		return export.Export(out)
	},
}

var importCmd = &cobra.Command{
	Use:     "import [file]",
	Short:   `Import a registry from an export file.`,
	PreRunE: compose(prepareRegistry, prepareSpaces),
	RunE: func(cmd *cobra.Command, args []string) (err error) {
		var in io.Reader
		if len(args) > 0 {
			filename := args[0]
			file, e := os.Open(filename)
			if e != nil {
				return e
			}
			defer func() {
				if e := file.Close(); e != nil && err == nil {
					err = e
				}
			}()
			in = file
		} else {
			in = os.Stdin
		}

		if importDropFlag {
			if err := export.Drop(); err != nil {
				return err
			}
		}

		if err = export.Import(in); err != nil {
			return err
		}
		fmt.Println("Import finished successfully.")
		return nil
	},
}
