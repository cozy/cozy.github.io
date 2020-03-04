package config

import (
	"bytes"
	"fmt"
	"html/template"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/viper"
)

var configFileFolders = []string{"/etc/cozy", ""}

// SetDefaults configures a few default values in viper.
func SetDefaults() {
	viper.SetEnvPrefix("cozy_registry")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()
	viper.SetDefault("port", 8080)
	viper.SetDefault("host", "localhost")
	viper.SetDefault("couchdb.url", "http://localhost:5984/")
	viper.SetDefault("couchdb.prefix", "cozyregistry")
	viper.SetDefault("conservation.enable_background_cleaning", false)
	viper.SetDefault("conservation.major", 2)
	viper.SetDefault("conservation.minor", 2)
	viper.SetDefault("conservation.month", 2)
}

// ReadFile reads the config file, parses it, and loads the values in viper.
func ReadFile(file, defaultFile string) error {
	if file == "" {
		if f, ok := findConfigFile(defaultFile); ok {
			file = f
		} else {
			return nil
		}
	}

	parser := template.New(filepath.Base(file))
	parser = parser.Option("missingkey=zero")
	tmpl, err := parser.ParseFiles(file)
	if err != nil {
		return fmt.Errorf("Failed to parse cozy-apps-registry configuration %q: %w",
			file, err)
	}

	dest := new(bytes.Buffer)
	ctxt := &struct{ Env map[string]string }{Env: envMap()}
	err = tmpl.ExecuteTemplate(dest, filepath.Base(file), ctxt)
	if err != nil {
		return fmt.Errorf("Failed to parse cozy-apps-registry configuration %q: %w",
			file, err)
	}

	if ext := filepath.Ext(file); len(ext) > 0 {
		viper.SetConfigType(ext[1:])
	}

	if err = viper.ReadConfig(dest); err != nil {
		return fmt.Errorf("Failed to read cozy-apps-registry configuration %q: %w",
			file, err)
	}

	return nil
}

// findConfigFile looks for a cozy-registry config file in multiple folders
// Taken from https://github.com/cozy/cozy-stack/blob/fc983af5ffb3016a5377c7aaf62ae21c3f20861e/pkg/config/config/config.go#L902-L917
func findConfigFile(name string) (string, bool) {
	for _, cp := range configFileFolders {
		for _, ext := range viper.SupportedExts {
			filename := filepath.Join(AbsPath(cp), fmt.Sprintf("%s.%s", name, ext))
			_, err := os.Stat(filename)
			if err != nil {
				continue
			}
			return filename, true
		}
	}
	return "", false
}

// AbsPath returns an absolute path, with ~ and $VAR expanded.
func AbsPath(inPath string) string {
	if strings.HasPrefix(inPath, "~") {
		home, err := os.UserHomeDir()
		if err != nil {
			return ""
		}
		inPath = home + inPath[len("~"):]
	} else if strings.HasPrefix(inPath, "$HOME") {
		home, err := os.UserHomeDir()
		if err != nil {
			return ""
		}
		inPath = home + inPath[len("$HOME"):]
	}

	if strings.HasPrefix(inPath, "$") {
		end := strings.Index(inPath, string(os.PathSeparator))
		inPath = os.Getenv(inPath[1:end]) + inPath[end:]
	}

	p, err := filepath.Abs(inPath)
	if err == nil {
		return filepath.Clean(p)
	}

	return ""
}

func envMap() map[string]string {
	env := make(map[string]string)
	for _, i := range os.Environ() {
		sep := strings.Index(i, "=")
		env[i[0:sep]] = i[sep+1:]
	}
	return env
}
