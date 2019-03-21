package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/cozy/cozy-apps-registry/utils"
	"github.com/spf13/viper"
)

var configFileFolders = []string{"/etc/cozy", ""}

// FindConfigFile looks for a cozy-registry config file in multiple folders
func FindConfigFile(name string) (string, bool) {
	for _, cp := range configFileFolders {
		for _, ext := range viper.SupportedExts {
			filename := filepath.Join(utils.AbsPath(cp), fmt.Sprintf("%s.%s", name, ext))
			_, err := os.Stat(filename)
			if err != nil {
				continue
			}
			return filename, true
		}
	}
	return "", false
}
