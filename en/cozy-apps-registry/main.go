package main

import (
	"bufio"
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"io/ioutil"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/cozy/cozy-apps-registry/asset"
	"github.com/cozy/cozy-apps-registry/auth"
	"github.com/cozy/cozy-apps-registry/cache"
	"github.com/cozy/cozy-apps-registry/config"
	"github.com/cozy/cozy-apps-registry/consts"
	"github.com/cozy/cozy-apps-registry/registry"
	"github.com/go-redis/redis/v7"
	"github.com/howeyc/gopass"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

const envSessionPass = "REGISTRY_SESSION_PASS"
const defaultTTL = 5 * time.Minute

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
var fixerSpacesFlag []string
var minorFlag int
var majorFlag int
var durationFlag int
var forceFlag bool
var dryRunFlag bool

var editorAutoPublicationFlag bool
var importDrop bool

var flagInfraMaintenance bool
var flagShortMaintenance bool
var flagDisallowManualExec bool

var editorRegistry *auth.EditorRegistry
var sessionSecret []byte

var ctx = context.Background()

func init() {
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
	rootCmd.AddCommand(printPublicKeyCmd)
	rootCmd.AddCommand(verifySignatureCmd)
	rootCmd.AddCommand(addEditorCmd)
	rootCmd.AddCommand(rmEditorCmd)
	rootCmd.AddCommand(lsEditorsCmd)
	rootCmd.AddCommand(lsAppsCmd)
	rootCmd.AddCommand(addAppCmd)
	rootCmd.AddCommand(modifyAppCmd)
	rootCmd.AddCommand(maintenanceCmd)
	rootCmd.AddCommand(rmAppVersionCmd)
	rootCmd.AddCommand(rmSpaceCmd)
	maintenanceCmd.AddCommand(maintenanceActivateAppCmd)
	maintenanceCmd.AddCommand(maintenanceDeactivateAppCmd)
	rootCmd.AddCommand(exportCmd)
	rootCmd.AddCommand(importCmd)

	rootCmd.AddCommand(fixerCmd)
	fixerCmd.AddCommand(assetsCmd)
	fixerCmd.AddCommand(oldVersionsCmd)

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
	rmAppVersionCmd.Flags().StringVar(&appSpaceFlag, "space", "", "specify the application space")

	fixerCmd.Flags().StringSliceVar(&fixerSpacesFlag, "spaces", nil, "Specify spaces")
	oldVersionsCmd.Flags().StringVar(&appSpaceFlag, "space", "", "specify the application space")
	oldVersionsCmd.Flags().IntVar(&minorFlag, "minor", 2, "specify the maximum number of major versions to keep")
	oldVersionsCmd.Flags().IntVar(&majorFlag, "major", 2, "specify the maximum number of minor versions for each major version to keep")
	oldVersionsCmd.Flags().IntVar(&durationFlag, "duration", 2, "number of months to check")
	oldVersionsCmd.Flags().BoolVar(&dryRunFlag, "no-dry-run", false, "do no dry run and removes the apps")

	modifyAppCmd.Flags().StringVar(&appSpaceFlag, "space", "", "specify the application space")
	modifyAppCmd.Flags().StringVar(&appDUCFlag, "data-usage-commitment", "", "Specify the data usage commitment: user_ciphered, user_reserved or none")
	modifyAppCmd.Flags().StringVar(&appDUCByFlag, "data-usage-commitment-by", "", "Specify the usage commitment author: cozy, editor or none")

	rmSpaceCmd.Flags().BoolVar(&forceFlag, "force", false, "skip confirmation prompt")
	maintenanceActivateAppCmd.Flags().BoolVar(&flagInfraMaintenance, "infra", false, "specify a maintenance specific to our infra")
	maintenanceActivateAppCmd.Flags().BoolVar(&flagShortMaintenance, "short", false, "specify a short maintenance")
	maintenanceActivateAppCmd.Flags().BoolVar(&flagDisallowManualExec, "no-manual-exec", false, "specify a maintenance disallowing manual execution")
	maintenanceActivateAppCmd.Flags().StringVar(&appSpaceFlag, "space", "", "specify the application space")

	maintenanceDeactivateAppCmd.Flags().StringVar(&appSpaceFlag, "space", "", "specify the application space")

	addEditorCmd.Flags().BoolVar(&editorAutoPublicationFlag, "auto-publication", false, "activate auto-publication of version for this editor")

	importCmd.Flags().BoolVarP(&importDrop, "drop", "d", false, "drop couchdb database & swift container before import")
}

func useConfig(cmd *cobra.Command) (err error) {
	viper.SetEnvPrefix("cozy_registry")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()
	viper.SetDefault("port", 8080)
	viper.SetDefault("host", "localhost")
	viper.SetDefault("couchdb.url", "http://localhost:5984/")
	viper.SetDefault("couchdb.prefix", "cozyregistry")

	var cfgFile string
	if cfgFileFlag == "" {
		if file, ok := config.FindConfigFile("cozy-registry"); ok {
			cfgFile = file
		}
	} else {
		cfgFile = cfgFileFlag
	}
	if cfgFile == "" {
		return nil
	}

	tmpl := template.New(filepath.Base(cfgFile))
	tmpl = tmpl.Option("missingkey=zero")
	tmpl, err = tmpl.ParseFiles(cfgFile)
	if err != nil {
		return fmt.Errorf("Failed to parse cozy-apps-registry configuration %q: %s",
			cfgFile, err)
	}

	dest := new(bytes.Buffer)
	ctxt := &struct{ Env map[string]string }{Env: envMap()}
	err = tmpl.ExecuteTemplate(dest, filepath.Base(cfgFile), ctxt)
	if err != nil {
		return fmt.Errorf("Failed to parse cozy-apps-registry configuration %q: %s",
			cfgFile, err)
	}

	if ext := filepath.Ext(cfgFile); len(ext) > 0 {
		viper.SetConfigType(ext[1:])
	}

	if err = viper.ReadConfig(dest); err != nil {
		return fmt.Errorf("Failed to read cozy-apps-registry configuration %q: %s",
			cfgFile, err)
	}

	// Create cache
	if redisURL := viper.GetString("redis.addrs"); redisURL != "" {
		optsLatest := &redis.UniversalOptions{
			// Either a single address or a seed list of host:port addresses
			// of cluster/sentinel nodes.
			Addrs: viper.GetStringSlice("redis.addrs"),

			// The sentinel master name.
			// Only failover clients.
			MasterName: viper.GetString("redis.master"),

			// Enables read only queries on slave nodes.
			ReadOnly: viper.GetBool("redis.read_only_slave"),

			MaxRetries:         viper.GetInt("redis.max_retries"),
			Password:           viper.GetString("redis.password"),
			DialTimeout:        viper.GetDuration("redis.dial_timeout"),
			ReadTimeout:        viper.GetDuration("redis.read_timeout"),
			WriteTimeout:       viper.GetDuration("redis.write_timeout"),
			PoolSize:           viper.GetInt("redis.pool_size"),
			PoolTimeout:        viper.GetDuration("redis.pool_timeout"),
			IdleTimeout:        viper.GetDuration("redis.idle_timeout"),
			IdleCheckFrequency: viper.GetDuration("redis.idle_check_frequency"),
			DB:                 viper.GetInt("redis.databases.versionsLatest"),
		}

		optsList := &redis.UniversalOptions{
			// Either a single address or a seed list of host:port addresses
			// of cluster/sentinel nodes.
			Addrs: viper.GetStringSlice("redis.addrs"),

			// The sentinel master name.
			// Only failover clients.
			MasterName: viper.GetString("redis.master"),

			// Enables read only queries on slave nodes.
			ReadOnly: viper.GetBool("redis.read_only_slave"),

			MaxRetries:         viper.GetInt("redis.max_retries"),
			Password:           viper.GetString("redis.password"),
			DialTimeout:        viper.GetDuration("redis.dial_timeout"),
			ReadTimeout:        viper.GetDuration("redis.read_timeout"),
			WriteTimeout:       viper.GetDuration("redis.write_timeout"),
			PoolSize:           viper.GetInt("redis.pool_size"),
			PoolTimeout:        viper.GetDuration("redis.pool_timeout"),
			IdleTimeout:        viper.GetDuration("redis.idle_timeout"),
			IdleCheckFrequency: viper.GetDuration("redis.idle_check_frequency"),
			DB:                 viper.GetInt("redis.databases.versionsList"),
		}
		redisCacheVersionsLatest := redis.NewUniversalClient(optsLatest)
		redisCacheVersionsList := redis.NewUniversalClient(optsList)

		res := redisCacheVersionsLatest.Ping()
		if res.Err() == nil {
			viper.Set("cacheVersionsLatest", cache.NewRedisCache(defaultTTL, redisCacheVersionsLatest))
			viper.Set("cacheVersionsList", cache.NewRedisCache(defaultTTL, redisCacheVersionsList))
			return nil
		}
	}

	viper.Set("cacheVersionsLatest", cache.NewLRUCache(256, defaultTTL))
	viper.Set("cacheVersionsList", cache.NewLRUCache(256, defaultTTL))

	return nil
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		printAndExit(err)
	}
	os.Exit(0)
}

var rootCmd = &cobra.Command{
	Use:           "cozy-registry",
	Short:         "cozy-registry is a registry site to store links to cozy applications",
	SilenceUsage:  true,
	SilenceErrors: true,
	PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
		err := useConfig(cmd)
		if err != nil {
			return err
		}
		return config.Init()
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
		InitLogger(LoggerOptions{Syslog: viper.GetBool("syslog")})
		address := fmt.Sprintf("%s:%d", viper.GetString("host"), viper.GetInt("port"))
		fmt.Printf("Listening on %s...\n", address)
		errc := make(chan error)
		router := Router(address)
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

var fixerCmd = &cobra.Command{
	Use:     "fixer",
	Short:   "Fixer commands",
	PreRunE: compose(prepareRegistry, prepareSpaces),
	RunE: func(cmd *cobra.Command, args []string) (err error) {
		return cmd.Help()
	},
}

var assetsCmd = &cobra.Command{
	Use:     "assets-swift",
	Short:   "Move assets to swift",
	Long:    "Move assets (like icon, partnership_icon or screenshots) from all apps and konnectors to swift",
	PreRunE: compose(prepareRegistry, prepareSpaces),
	RunE: func(cmd *cobra.Command, args []string) (err error) {
		var spacePrefix string

		conf := config.GetConfig()
		sc := conf.SwiftConnection

		var spaces []string
		if len(fixerSpacesFlag) > 0 {
			spaces = fixerSpacesFlag
		} else {
			spaces = registry.GetSpacesNames()
		}
		// Iterate over each space
		for _, space := range spaces {
			s, ok := registry.GetSpace(space)
			db := s.VersDB()

			if !ok {
				return fmt.Errorf("Cannot get space %s", space)
			}

			spacePrefix = registry.GetPrefixOrDefault(s)

			log.Println("Working on space ", spacePrefix)
			// Create container if not exists
			if _, _, err := sc.Container(spacePrefix); err != nil {
				err = sc.ContainerCreate(spacePrefix, nil)
				if err != nil {
					return err
				}
			}
			var cursor int = 0
			for cursor != -1 {
				next, apps, err := registry.GetAppsList(s, &registry.AppsListOptions{
					Limit:                200,
					Cursor:               cursor,
					LatestVersionChannel: registry.Stable,
					VersionsChannel:      registry.Dev,
				})
				if err != nil {
					return err
				}
				cursor = next

				for _, app := range apps { // Iterate over 200 apps
					log.Println("Working on app", app.Slug)
					// Skipping app with no versions
					if !app.Versions.HasVersions {
						continue
					}
					for _, version := range app.Versions.GetAll() {
						v, err := registry.FindVersion(s, app.Slug, version)
						if err != nil {
							return err
						}
						log.Println("Retreiving attachments for", app.Slug+"/"+version)

						versionRev := v.Rev

						// Iterate over each attachment to move it from CouchDB to Swift
						for name, attachment := range v.Attachments {

							a := attachment.(map[string]interface{})
							filename := name
							contentType := a["content_type"].(string)
							attachment, err := registry.FindVersionOldAttachment(s, app.Slug, version, filename)
							if err != nil {
								return err
							}

							fp := filepath.Join(app.Slug, version, filename)
							f, err := sc.ObjectCreate(spacePrefix, fp, false, "", contentType, nil) // Create the swift object
							if err != nil {
								return err
							}
							content, err := ioutil.ReadAll(attachment.Content)
							if err != nil {
								f.Close()
								return err
							}
							_, err = f.Write(content)
							f.Close()
							if err != nil {
								return err
							}

							// Now the file is in Swift, removing the attachment from CouchDB
							versionRev, err = db.DeleteAttachment(ctx, v.ID, versionRev, filename)
							if err != nil {
								return err
							}
						}
					}
				}
			}
		}
		return
	},
}

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
		space, _ := registry.GetSpace(appSpaceFlag)
		noDryRun := dryRunFlag
		if !noDryRun {
			fmt.Println("Info: This is a dry run, the apps will not be removed")
		}
		return registry.CleanOldVersions(space, appSlug, channel, durationFlag, majorFlag, minorFlag, !noDryRun)
	},
}

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
var printPublicKeyCmd = &cobra.Command{
	Use:     "pubkey [editor]",
	Short:   `Print the PEM encoded public key of the specified editor`,
	PreRunE: prepareRegistry,
	RunE: func(cmd *cobra.Command, args []string) error {
		editor, _, err := fetchEditor(args)
		if err != nil {
			return err
		}
		fmt.Print(editor.MarshalPublicKeyPEM())
		return nil
	},
}

var verifySignatureCmd = &cobra.Command{
	Use:     "verify [editor] [file]",
	Short:   `Verify a signature given via stdin for a specified editor and file`,
	PreRunE: prepareRegistry,
	RunE: func(cmd *cobra.Command, args []string) (err error) {
		editor, args, err := fetchEditor(args)
		if err != nil {
			return err
		}
		if len(args) == 0 {
			return fmt.Errorf("Missing argument for file path")
		}

		fmt.Fprintf(os.Stderr, "Waiting for signature on stdin...")
		signature, err := ioutil.ReadAll(io.LimitReader(os.Stdin, 10*1024))
		if err != nil {
			return fmt.Errorf("Error reading signature on stdin: %s", err)
		}

		fmt.Fprintln(os.Stderr, "ok")
		filePath := registry.AbsPath(args[0])
		f, err := os.Open(filePath)
		if err != nil {
			return fmt.Errorf("Failed to open file %q: %s", filePath, err)
		}
		defer f.Close()

		hash := sha256.New()
		_, err = io.Copy(hash, f)
		if err != nil {
			return fmt.Errorf("Could not read file %q: %s", filePath, err)
		}
		hashed := hash.Sum(nil)

		signatureB64, err := base64.StdEncoding.DecodeString(string(signature))
		if err == nil {
			signature = signatureB64
		}

		fmt.Fprintf(os.Stderr, "Checking signature...")
		if !editor.VerifySignature(hashed, signature) {
			return fmt.Errorf("failed: bad signature")
		}
		fmt.Fprintln(os.Stderr, "ok")

		return nil
	},
}

var durationReg = regexp.MustCompile(`^([0-9][0-9\.]*)(years|year|y|days|day|d)`)

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
			token, err = editor.GenerateMasterToken(sessionSecret, maxAge)
		} else if appNameFlag != "" {
			space, ok := registry.GetSpace(appSpaceFlag)
			if !ok {
				err = fmt.Errorf("Space %q does not exist", appSpaceFlag)
			} else {
				var app *registry.App
				app, err = registry.FindApp(space, appNameFlag, registry.Stable)
				if err == nil {
					token, err = editor.GenerateEditorToken(sessionSecret, maxAge, app.Slug)
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
	if m := tokenMaxAgeFlag; m != "" {
		for {
			submatch := durationReg.FindStringSubmatch(m)
			if len(submatch) != 3 {
				break
			}
			value := submatch[1]
			unit := submatch[2]
			var f float64
			f, err = strconv.ParseFloat(value, 10)
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
			token, err = ioutil.ReadAll(io.LimitReader(os.Stdin, 10*1024))
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
			ok = editor.VerifyMasterToken(sessionSecret, token)
		} else if appNameFlag == "" {
			return fmt.Errorf("missing --app flag")
		} else {
			var space *registry.Space
			space, ok = registry.GetSpace(appSpaceFlag)
			if !ok {
				return fmt.Errorf("Space %q does not exist", appSpaceFlag)
			}
			app, err := registry.FindApp(space, appNameFlag, registry.Stable)
			if err != nil {
				return err
			}
			ok = editor.VerifyEditorToken(sessionSecret, token, app.Slug)
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
			err = editorRegistry.RevokeMasterTokens(editor)
		} else {
			err = editorRegistry.RevokeEditorTokens(editor)
		}
		return err
	},
}

var genSessionSecret = &cobra.Command{
	Use:   "gen-session-secret [path]",
	Short: `Generate a session secret file`,
	PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
		return useConfig(cmd)
	},
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
			_, err = editorRegistry.GetEditor(editorName)
			if err == nil {
				if len(args) > 0 {
					return auth.ErrEditorExists
				}
				fmt.Fprintln(os.Stderr, auth.ErrEditorExists)
				continue
			}
			break
		}

		// associatePublicKey := askQuestion(false, "Associate a public key to the editor %q ?", editorName)
		// if associatePublicKey {
		// 	var encodedPublicKey []byte

		// 	for {
		// 		var publicKeyPath string
		// 		var publicKeyFile *os.File

		// 		publicKeyPath = prompt("Path to public key file:")

		// 		publicKeyPath = registry.AbsPath(publicKeyPath)
		// 		publicKeyFile, err = os.Open(publicKeyPath)
		// 		if err != nil {
		// 			fmt.Printf("Error while loading file %q: %s.\nPlease retry.\n\n",
		// 				publicKeyPath, err.Error())
		// 			continue
		// 		}

		// 		encodedPublicKey, err = ioutil.ReadAll(io.LimitReader(publicKeyFile, 10*1024))
		// 		if err != nil {
		// 			fmt.Printf("Error while loading file %q: %s.\nPlease retry.\n\n",
		// 				publicKeyPath, err.Error())
		// 			continue
		// 		}

		// 		break
		// 	}

		// 	fmt.Printf("Creating new editor with given public key...")
		// 	_, err = editorRegistry.CreateEditorWithPublicKey(editorName, encodedPublicKey)
		// } else {
		// }

		fmt.Printf("Creating new editor %q...", editorName)
		_, err = editorRegistry.CreateEditorWithoutPublicKey(editorName, editorAutoPublicationFlag)
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
		err = editorRegistry.DeleteEditor(editor)
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
		editors, err := editorRegistry.AllEditors()
		if err != nil {
			return err
		}
		for _, editor := range editors {
			fmt.Println(editor.Name())
		}
		return nil
	},
}

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

		res, err := db.Find(context.TODO(), search)
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

		editor, err := editorRegistry.GetEditor(appEditorFlag)
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

var rmAppVersionCmd = &cobra.Command{
	Use:     "rm-app-version <slug> <version>",
	Short:   `Deletes an app version`,
	PreRunE: compose(prepareRegistry, prepareSpaces),
	RunE: func(cmd *cobra.Command, args []string) (err error) {
		if len(args) != 2 {
			return cmd.Help()
		}
		space, ok := registry.GetSpace(appSpaceFlag)
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
			FlagInfraMaintenance:   flagInfraMaintenance,
			FlagShortMaintenance:   flagShortMaintenance,
			FlagDisallowManualExec: flagDisallowManualExec,
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
		return registry.Export(out)
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

		if importDrop {
			if err := registry.Drop(); err != nil {
				return err
			}
		}

		if err = registry.Import(in); err != nil {
			return err
		}
		fmt.Println("Import finished successfully.")
		return nil
	},
}

func prepareRegistry(cmd *cobra.Command, args []string) error {
	editorsDB, err := registry.InitGlobalClient(
		viper.GetString("couchdb.url"),
		viper.GetString("couchdb.user"),
		viper.GetString("couchdb.password"),
		viper.GetString("couchdb.prefix"))
	if err != nil {
		return fmt.Errorf("Could not reach CouchDB: %s", err)
	}

	_, err = asset.InitGlobalAssetStore(
		viper.GetString("couchdb.url"),
		viper.GetString("couchdb.user"),
		viper.GetString("couchdb.password"),
		viper.GetString("couchdb.prefix"))
	if err != nil {
		return fmt.Errorf("Could not reach CouchDB: %s", err)
	}

	vault := auth.NewCouchDBVault(editorsDB)
	editorRegistry, err = auth.NewEditorRegistry(vault)
	if err != nil {
		return fmt.Errorf("Error while loading editor registry: %s", err)
	}

	return nil
}

func getVspaceKeys(vspaces map[string]interface{}) []string {
	vspaceKeys := make([]string, 0, len(vspaces))
	for k := range vspaces {
		vspaceKeys = append(vspaceKeys, k)
	}
	return vspaceKeys
}

// checkSpaceVspaceOverlap checks if a space and a vspace holds the same name
func checkSpaceVspaceOverlap(spaces []string, vspaces map[string]interface{}) (bool, string) {
	// Retreiving vspaces keys
	vspaceKeys := getVspaceKeys(vspaces)
	for _, vspace := range vspaceKeys {
		for _, space := range spaces {
			if vspace == space {
				return true, vspace
			}
		}
	}
	return false, ""
}

func prepareSpaces(cmd *cobra.Command, args []string) error {
	spacesNames := viper.GetStringSlice("spaces")
	if len(spacesNames) == 0 {
		spacesNames = viper.GetStringSlice("contexts") // retro-compat
	}
	if len(spacesNames) > 0 {
		if ok, name := checkSpaceVspaceOverlap(spacesNames, viper.GetStringMap("virtual_spaces")); ok {
			return fmt.Errorf("%q is defined as a space and a virtual space (check your config file)", name)
		}
		for _, spaceName := range spacesNames {
			if err := registry.RegisterSpace(spaceName); err != nil {
				return err
			}

			if spaceName == consts.DefaultSpacePrefix {
				spaceName = ""
			}

			// Create apps view
			s, ok := registry.GetSpace(spaceName)
			if ok {
				db := s.VersDB()
				if err := registry.CreateVersionsDateView(db); err != nil {
					return err
				}
			}
		}
		return nil
	}

	return registry.RegisterSpace(consts.DefaultSpacePrefix)
}

func loadSessionSecret(cmd *cobra.Command, args []string) error {
	sessionSecretPath := viper.GetString("session-secret")
	if sessionSecretPath == "" {
		return fmt.Errorf("Missing path to session secret file")
	}

	sessionSecretPath = registry.AbsPath(sessionSecretPath)

	f, err := os.Open(sessionSecretPath)
	if os.IsNotExist(err) {
		printAndExit(`Could not find session secret file: %q.

Consider using the "gen-session-secret" command to generate the file and adding
it to you configuration file.`, sessionSecretPath)
	}
	if err != nil {
		return err
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
		return fmt.Errorf("Session secret is not properly base64 encoded in %q: %s",
			sessionSecretPath, err)
	}

	if auth.IsSecretClear(data) {
		sessionSecret = data
		return nil
	}

	{
		envPassphrase := []byte(os.Getenv(envSessionPass))
		if len(envPassphrase) > 0 {
			sessionSecret, err = auth.DecryptMasterSecret(data, envPassphrase)
			if err != nil {
				return fmt.Errorf("Could not decrypt session secret: %s", err)
			}
			return nil
		}
	}

	for {
		passphrase := askPassword("Enter passphrase (decrypting session secret): ")
		sessionSecret, err = auth.DecryptMasterSecret(data, passphrase)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Could not decrypt session secret: %s\n", err)
			continue
		}
		return nil
	}
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
	editor, err = editorRegistry.GetEditor(editorName)
	if err != nil {
		err = fmt.Errorf("Error while getting editor: %s", err)
	}
	return
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

func envMap() map[string]string {
	env := make(map[string]string)
	for _, i := range os.Environ() {
		sep := strings.Index(i, "=")
		env[i[0:sep]] = i[sep+1:]
	}
	return env
}
