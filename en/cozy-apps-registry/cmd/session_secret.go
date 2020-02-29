package cmd

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"os"
	"strings"

	"github.com/cozy/cozy-apps-registry/auth"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var genSessionSecret = &cobra.Command{
	Use:   "gen-session-secret [path]",
	Short: `Generate a session secret file`,
	RunE: func(cmd *cobra.Command, args []string) (err error) {
		// go has no way to distinguish between a flag's default value or if a flag
		// is actually set.
		var found bool
		for _, arg := range os.Args {
			if strings.HasPrefix(arg, "--passphrase=") ||
				arg == "-passphrase" ||
				arg == "--passphrase" {
				found = true
				break
			}
		}
		if !found {
			passphraseFlag = nil
		}

		var filePath string
		if len(args) == 0 {
			filePath = viper.GetString("session-secret")
		} else {
			filePath = args[0]
		}
		if filePath == "" {
			return fmt.Errorf("Missing file path to generate the secret")
		}

		fmt.Printf("Creating file %q... ", filePath)
		file, err := os.OpenFile(filePath, os.O_CREATE|os.O_TRUNC|os.O_WRONLY|os.O_EXCL, 0600)
		if err != nil {
			return err
		}
		defer func() {
			if e := file.Close(); e != nil && err == nil {
				err = e
			}
		}()

		var passphrase []byte
		if passphraseFlag == nil || *passphraseFlag {
			forcePassphrase := passphraseFlag != nil && *passphraseFlag
			for {
				var passPrompt string
				if forcePassphrase {
					passPrompt = "Enter passphrase: "
				} else {
					passPrompt = "Enter passphrase (empty for no passphrase): "
				}
				passphrase = askPassword(passPrompt)
				if len(passphrase) == 0 {
					if forcePassphrase {
						fmt.Println("Passphrase is empty. Please retry.")
						continue
					}
					if askQuestion(false, "Are you sure you do NOT want to encrypt the session secret ?") {
						break
					} else {
						continue
					}
				}
				if c := askPassword("Confirm passphrase: "); !bytes.Equal(passphrase, c) {
					fmt.Fprintln(os.Stderr, "Passphrases do not match. Please retry.")
					continue
				}
				break
			}
		}

		secret := auth.GenerateMasterSecret()

		if len(passphrase) > 0 {
			secret, err = auth.EncryptMasterSecret(secret, passphrase)
			if err != nil {
				return fmt.Errorf("Failed to encrypt session secret: %s", err)
			}
		}

		_, err = fmt.Fprintln(file, base64.StdEncoding.EncodeToString(secret))
		return err
	},
}
