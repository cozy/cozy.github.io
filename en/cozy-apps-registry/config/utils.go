package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/viper"
)

var configFileFolders = []string{"/etc/cozy", ""}

// FindConfigFile looks for a cozy-registry config file in multiple folders
// Taken from https://github.com/cozy/cozy-stack/blob/fc983af5ffb3016a5377c7aaf62ae21c3f20861e/pkg/config/config/config.go#L902-L917
func FindConfigFile(name string) (string, bool) {
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

// AbsPath returns an absolute path.
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
