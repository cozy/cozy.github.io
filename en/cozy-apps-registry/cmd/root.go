package cmd

import (
	"bufio"
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"os"
	"os/signal"
	"strings"
	"time"

	"github.com/cozy/cozy-apps-registry/auth"
	"github.com/cozy/cozy-apps-registry/base"
	"github.com/cozy/cozy-apps-registry/config"
	"github.com/cozy/cozy-apps-registry/web"
	"github.com/howeyc/gopass"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

const envSessionPass = "REGISTRY_SESSION_PASS"

var cfgFileFlag string
var tokenMaxAgeFlag string
var tokenMasterFlag bool
var passphraseFlag *bool
var appEditorFlag string
var appTypeFlag string
var appSpaceFlag string
var appNameFlag string
var appDUCFlag string
var appDUCByFlag string
var minorFlag int
var majorFlag int
var durationFlag int
var forceFlag bool
var noDryRunFlag bool
var editorAutoPublicationFlag bool
var importDropFlag bool
var infraMaintenanceFlag bool
var shortMaintenanceFlag bool
var disallowManualExecFlag bool

// Root returns the main command to execute, with all the subcommands and flags
// ready to be used.
func Root() *cobra.Command {
	flags := rootCmd.PersistentFlags()

	flags.StringVarP(&cfgFileFlag, "config", "c", "", "configuration file")

	flags.String("host", "localhost", "host to listen on")
	checkNoErr(viper.BindPFlag("host", flags.Lookup("host")))

	flags.Int("port", 8080, "port to listen on")
	checkNoErr(viper.BindPFlag("port", flags.Lookup("port")))

	flags.String("couchdb-url", "http://localhost:5984", "address of couchdb")
	checkNoErr(viper.BindPFlag("couchdb.url", flags.Lookup("couchdb-url")))

	flags.String("couchdb-user", "", "user of couchdb")
	checkNoErr(viper.BindPFlag("couchdb.user", flags.Lookup("couchdb-user")))

	flags.String("couchdb-password", "", "password of couchdb")
	checkNoErr(viper.BindPFlag("couchdb.password", flags.Lookup("couchdb-password")))

	flags.String("couchdb-prefix", "", "prefix for couchdb databases")
	checkNoErr(viper.BindPFlag("couchdb.prefix", flags.Lookup("couchdb-prefix")))

	flags.String("session-secret", "sessionsecret.key", "path to the session secret file")
	checkNoErr(viper.BindPFlag("session-secret", flags.Lookup("session-secret")))

	flags.StringSlice("spaces", nil, "list of available spaces")
	checkNoErr(viper.BindPFlag("spaces", flags.Lookup("spaces")))

	flags.StringSlice("contexts", nil, "deprecated and renamed `--spaces`")
	checkNoErr(viper.BindPFlag("contexts", flags.Lookup("contexts")))

	flags.Bool("syslog", false, "enable syslog logging")
	checkNoErr(viper.BindPFlag("syslog", flags.Lookup("syslog")))

	rootCmd.AddCommand(serveCmd)
	rootCmd.AddCommand(genTokenCmd)
	rootCmd.AddCommand(verifyTokenCmd)
	rootCmd.AddCommand(revokeTokensCmd)
	rootCmd.AddCommand(genSessionSecret)
	rootCmd.AddCommand(addEditorCmd)
	rootCmd.AddCommand(rmEditorCmd)
	rootCmd.AddCommand(lsEditorsCmd)
	rootCmd.AddCommand(lsAppsCmd)
	rootCmd.AddCommand(addAppCmd)
	rootCmd.AddCommand(modifyAppCmd)
	rootCmd.AddCommand(rmAppCmd)
	rootCmd.AddCommand(overwriteAppNameCmd)
	rootCmd.AddCommand(overwriteAppIconCmd)
	rootCmd.AddCommand(maintenanceCmd)
	rootCmd.AddCommand(rmAppVersionCmd)
	rootCmd.AddCommand(rmSpaceCmd)
	maintenanceCmd.AddCommand(maintenanceActivateAppCmd)
	maintenanceCmd.AddCommand(maintenanceDeactivateAppCmd)
	rootCmd.AddCommand(exportCmd)
	rootCmd.AddCommand(importCmd)
	rootCmd.AddCommand(oldVersionsCmd)
	rootCmd.AddCommand(completionCmd)

	passphraseFlag = genSessionSecret.Flags().Bool("passphrase", false, "enforce or dismiss the session secret encryption")

	genTokenCmd.Flags().StringVar(&tokenMaxAgeFlag, "max-age", "", "validity duration of the token")

	genTokenCmd.Flags().BoolVar(&tokenMasterFlag, "master", false, "generate a master token to create applications")
	genTokenCmd.Flags().StringVar(&appNameFlag, "app", "", "application name allowed for the generated token")
	genTokenCmd.Flags().StringVar(&appSpaceFlag, "space", "", "specify the application space")
	revokeTokensCmd.Flags().BoolVar(&tokenMasterFlag, "master", false, "revoke a master tokens")
	verifyTokenCmd.Flags().BoolVar(&tokenMasterFlag, "master", false, "verify a master tokens")
	verifyTokenCmd.Flags().StringVar(&appNameFlag, "app", "", "application name allowed for the generated token")
	verifyTokenCmd.Flags().StringVar(&appSpaceFlag, "space", "", "specify the application space")

	addAppCmd.Flags().StringVar(&appEditorFlag, "app-editor", "", "specify the application editor")
	addAppCmd.Flags().StringVar(&appTypeFlag, "app-type", "", "specify the application type")
	addAppCmd.Flags().StringVar(&appSpaceFlag, "app-space", "", "specify the application space")
	addAppCmd.Flags().StringVar(&appDUCFlag, "data-usage-commitment", "", "Specify the data usage commitment: user_ciphered, user_reserved or none")
	addAppCmd.Flags().StringVar(&appDUCByFlag, "data-usage-commitment-by", "", "Specify the usage commitment author: cozy, editor or none")
	if err := addAppCmd.MarkFlagRequired("app-editor"); err != nil {
		fmt.Printf("Error on marking editor flag as required: %s", err)
	}
	if err := addAppCmd.MarkFlagRequired("app-type"); err != nil {
		fmt.Printf("Error on marking type flag as required: %s", err)
	}
	lsAppsCmd.Flags().StringVar(&appSpaceFlag, "space", "", "specify the application space")
	rmAppCmd.Flags().StringVar(&appSpaceFlag, "space", "", "specify the application space")
	overwriteAppNameCmd.Flags().StringVar(&appSpaceFlag, "space", "", "specify the application space")
	overwriteAppIconCmd.Flags().StringVar(&appSpaceFlag, "space", "", "specify the application space")
	rmAppVersionCmd.Flags().StringVar(&appSpaceFlag, "space", "", "specify the application space")

	oldVersionsCmd.Flags().StringVar(&appSpaceFlag, "space", "", "specify the application space")
	oldVersionsCmd.Flags().IntVar(&minorFlag, "minor", 2, "specify the maximum number of major versions to keep")
	oldVersionsCmd.Flags().IntVar(&majorFlag, "major", 2, "specify the maximum number of minor versions for each major version to keep")
	oldVersionsCmd.Flags().IntVar(&durationFlag, "duration", 2, "number of months to check")
	oldVersionsCmd.Flags().BoolVar(&noDryRunFlag, "no-dry-run", false, "do no dry run and removes the apps")

	modifyAppCmd.Flags().StringVar(&appSpaceFlag, "space", "", "specify the application space")
	modifyAppCmd.Flags().StringVar(&appDUCFlag, "data-usage-commitment", "", "Specify the data usage commitment: user_ciphered, user_reserved or none")
	modifyAppCmd.Flags().StringVar(&appDUCByFlag, "data-usage-commitment-by", "", "Specify the usage commitment author: cozy, editor or none")

	rmSpaceCmd.Flags().BoolVar(&forceFlag, "force", false, "skip confirmation prompt")
	maintenanceActivateAppCmd.Flags().BoolVar(&infraMaintenanceFlag, "infra", false, "specify a maintenance specific to our infra")
	maintenanceActivateAppCmd.Flags().BoolVar(&shortMaintenanceFlag, "short", false, "specify a short maintenance")
	maintenanceActivateAppCmd.Flags().BoolVar(&disallowManualExecFlag, "no-manual-exec", false, "specify a maintenance disallowing manual execution")
	maintenanceActivateAppCmd.Flags().StringVar(&appSpaceFlag, "space", "", "specify the application space")

	maintenanceDeactivateAppCmd.Flags().StringVar(&appSpaceFlag, "space", "", "specify the application space")

	addEditorCmd.Flags().BoolVar(&editorAutoPublicationFlag, "auto-publication", false, "activate auto-publication of version for this editor")

	importCmd.Flags().BoolVarP(&importDropFlag, "drop", "d", false, "drop couchdb database & swift container before import")

	return rootCmd
}

var rootCmd = &cobra.Command{
	Use:           "cozy-registry",
	Short:         "cozy-registry is a registry site to store links to cozy applications",
	SilenceUsage:  true,
	SilenceErrors: true,
	PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
		config.SetDefaults()
		return config.ReadFile(cfgFileFlag, "cozy-registry")
	},
	RunE: func(cmd *cobra.Command, args []string) error {
		return cmd.Help()
	},
}

var serveCmd = &cobra.Command{
	Use:     "serve",
	Short:   `Start the registry HTTP server`,
	PreRunE: compose(loadSessionSecret, prepareRegistry, prepareSpaces),
	RunE: func(cmd *cobra.Command, args []string) (err error) {
		config.SetupLogger(config.LoggerOptions{Syslog: viper.GetBool("syslog")})
		address := fmt.Sprintf("%s:%d", viper.GetString("host"), viper.GetInt("port"))
		fmt.Printf("Listening on %s...\n", address)
		errc := make(chan error)
		router := web.Router()
		go func() {
			errc <- router.Start(address)
		}()
		c := make(chan os.Signal, 1)
		signal.Notify(c, os.Interrupt)
		select {
		case err = <-errc:
			return err
		case <-c:
			ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()
			return router.Shutdown(ctx)
		}
	},
}

func prepareRegistry(cmd *cobra.Command, args []string) error {
	return config.SetupServices()
}

func prepareSpaces(cmd *cobra.Command, args []string) error {
	return config.PrepareSpaces()
}

func loadSessionSecret(cmd *cobra.Command, args []string) error {
	sessionSecretPath := viper.GetString("session-secret")
	if sessionSecretPath == "" {
		return fmt.Errorf("Missing path to session secret file")
	}

	sessionSecretPath = config.AbsPath(sessionSecretPath)

	f, err := os.Open(sessionSecretPath)
	if os.IsNotExist(err) {
		printAndExit(`Could not find session secret file: %q.

Consider using the "gen-session-secret" command to generate the file and adding
it to you configuration file.`, sessionSecretPath)
	}
	if err != nil {
		return fmt.Errorf("Cannot load session secret: %w", err)
	}

	var data []byte
	{
		buf := new(bytes.Buffer)
		_, err = io.Copy(buf, f)
		if err != nil {
			return err
		}
		data = buf.Bytes()
	}

	data, err = base64.StdEncoding.DecodeString(string(data))
	if err != nil {
		return fmt.Errorf("Session secret is not properly base64 encoded in %q: %w",
			sessionSecretPath, err)
	}

	if auth.IsSecretClear(data) {
		base.SessionSecret = data
		return nil
	}

	{
		envPassphrase := []byte(os.Getenv(envSessionPass))
		if len(envPassphrase) > 0 {
			base.SessionSecret, err = auth.DecryptMasterSecret(data, envPassphrase)
			if err != nil {
				return fmt.Errorf("Could not decrypt session secret: %w", err)
			}
			return nil
		}
	}

	for {
		passphrase := askPassword("Enter passphrase (decrypting session secret): ")
		base.SessionSecret, err = auth.DecryptMasterSecret(data, passphrase)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Could not decrypt session secret: %s\n", err)
			continue
		}
		return nil
	}
}

func readLine() string {
	r := bufio.NewReader(os.Stdin)
	s, err := r.ReadString('\n')
	if err != nil {
		printAndExit(err)
	}
	if len(s) == 0 {
		return s
	}
	return s[:len(s)-1]
}

func prompt(text string, a ...interface{}) string {
	fmt.Fprintf(os.Stderr, text+" ", a...)
	return readLine()
}

func askQuestion(defaultResponse bool, question string, a ...interface{}) bool {
	if defaultResponse {
		question += " [Y/n] "
	} else {
		question += " [y/N] "
	}
	fmt.Fprintf(os.Stderr, question, a...)
	for {
		resp := readLine()
		switch strings.ToLower(resp) {
		case "y", "yes":
			return true
		case "n", "no":
			return false
		case "":
			return defaultResponse
		default:
			fmt.Printf(`Respond with "yes" or "no": `)
			continue
		}
	}
}

func askPassword(prompt ...string) []byte {
	if len(prompt) == 0 {
		fmt.Fprintf(os.Stderr, "Enter passphrase: ")
	} else {
		fmt.Fprintf(os.Stderr, prompt[0])
	}
	pass, err := gopass.GetPasswdPrompt("", false, os.Stdin, os.Stderr)
	if err != nil {
		printAndExit(err)
	}
	return pass
}

func compose(hooks ...func(cmd *cobra.Command, args []string) error) func(cmd *cobra.Command, args []string) error {
	return func(cmd *cobra.Command, args []string) error {
		for _, hook := range hooks {
			if err := hook(cmd, args); err != nil {
				return err
			}
		}
		return nil
	}
}

func printAndExit(v interface{}, a ...interface{}) {
	fmt.Fprintf(os.Stderr, fmt.Sprintf("%s\n", v), a...)
	os.Exit(1)
}

func checkNoErr(err error) {
	if err != nil {
		panic(err)
	}
}
