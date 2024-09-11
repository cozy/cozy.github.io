package cmd

import (
	"encoding/base64"
	"fmt"
	"io"
	"os"
	"regexp"
	"strconv"
	"time"

	"github.com/cozy/cozy-apps-registry/auth"
	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/registry"
	"github.com/cozy/cozy-apps-registry/space"
	"github.com/spf13/cobra"
)

var genTokenCmd = &cobra.Command{
	Use:     "gen-editor-token [editor]",
	Aliases: []string{"gen-token"},
	Short:   `Generate a token for the specified editor`,
	PreRunE: compose(loadSessionSecret, prepareRegistry, prepareSpaces),
	RunE: func(cmd *cobra.Command, args []string) error {
		editor, _, err := fetchEditor(args)
		if err != nil {
			return err
		}

		maxAge, err := extractMagAge()
		if err != nil {
			return err
		}

		var token []byte
		if tokenMasterFlag {
			token, err = editor.GenerateMasterToken(base.SessionSecret, maxAge)
		} else if appNameFlag != "" {
			space, ok := space.GetSpace(appSpaceFlag)
			if !ok {
				err = fmt.Errorf("Space %q does not exist", appSpaceFlag)
			} else {
				var app *registry.App
				app, err = registry.FindApp(nil, space, appNameFlag, registry.Stable)
				if err == nil {
					token, err = editor.GenerateEditorToken(base.SessionSecret, maxAge, app.Slug)
				}
			}
		} else {
			err = fmt.Errorf("Should use either --app flag or --master flag")
		}
		if err != nil {
			return fmt.Errorf("Could not generate editor token for %q: %s",
				editor.Name(), err)
		}

		fmt.Println(base64.StdEncoding.EncodeToString(token))
		return nil
	},
}

func extractMagAge() (maxAge time.Duration, err error) {
	var durationReg = regexp.MustCompile(`^([0-9][0-9\.]*)(years|year|y|days|day|d)`)
	if m := tokenMaxAgeFlag; m != "" {
		for {
			submatch := durationReg.FindStringSubmatch(m)
			if len(submatch) != 3 {
				break
			}
			value := submatch[1]
			unit := submatch[2]
			var f float64
			f, err = strconv.ParseFloat(value, 64)
			if err != nil {
				err = fmt.Errorf("Could not parse max-age argument: %s", err)
				return
			}
			switch unit {
			case "y", "year", "years":
				maxAge += time.Duration(f * 365.25 * 24.0 * float64(time.Hour))
			case "d", "day", "days":
				maxAge += time.Duration(f * 24.0 * float64(time.Hour))
			}
			m = m[len(submatch[0]):]
		}
		if m != "" {
			var age time.Duration
			age, err = time.ParseDuration(m)
			if err != nil {
				err = fmt.Errorf("Could not parse max-age argument: %s", err)
				return
			}
			maxAge += age
		}
	}
	return
}

var verifyTokenCmd = &cobra.Command{
	Use:     "verify-token [editor] [token]",
	Short:   `Verify a token given via stdin for the specified editor`,
	PreRunE: compose(loadSessionSecret, prepareRegistry, prepareSpaces),
	RunE: func(cmd *cobra.Command, args []string) error {
		editor, rest, err := fetchEditor(args)
		if err != nil {
			return err
		}

		var token []byte
		if len(rest) > 0 && rest[0] != "-" {
			token = []byte(rest[0])
		} else {
			fmt.Fprintf(os.Stderr, "Waiting for token on stdin...")
			token, err = io.ReadAll(io.LimitReader(os.Stdin, 10*1024))
			if err != nil {
				return fmt.Errorf("Error reading token on stdin: %s", err)
			}
			fmt.Fprintln(os.Stderr, "ok")
		}

		tokenB64, err := base64.StdEncoding.DecodeString(string(token))
		if err == nil {
			token = tokenB64
		}

		var ok bool
		if tokenMasterFlag {
			ok = editor.VerifyMasterToken(base.SessionSecret, token)
		} else if appNameFlag == "" {
			return fmt.Errorf("missing --app flag")
		} else {
			var s *space.Space
			s, ok = space.GetSpace(appSpaceFlag)
			if !ok {
				return fmt.Errorf("Space %q does not exist", appSpaceFlag)
			}
			app, err := registry.FindApp(nil, s, appNameFlag, registry.Stable)
			if err != nil {
				return err
			}
			ok = editor.VerifyEditorToken(base.SessionSecret, token, app.Slug)
		}
		if !ok {
			return fmt.Errorf("token is **not** valid")
		}
		fmt.Println("token is valid")
		return nil
	},
}

var revokeTokensCmd = &cobra.Command{
	Use:     "revoke-tokens [editor]",
	Short:   `Revoke all tokens that have been generated for the specified editor`,
	PreRunE: compose(loadSessionSecret, prepareRegistry),
	RunE: func(cmd *cobra.Command, args []string) error {
		editor, _, err := fetchEditor(args)
		if err != nil {
			return err
		}
		var question string
		if tokenMasterFlag {
			question = "Are you sure you want to revoke MASTER tokens from %q ?"
		} else {
			question = "Are you sure you want to revoke SESSIONS tokens from %q ?"
		}
		if !askQuestion(true, question, editor.Name()) {
			return nil
		}
		if tokenMasterFlag {
			err = auth.Editors.RevokeMasterTokens(editor)
		} else {
			err = auth.Editors.RevokeEditorTokens(editor)
		}
		return err
	},
}
