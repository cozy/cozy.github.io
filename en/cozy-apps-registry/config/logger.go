package config

import (
	"io/ioutil"
	"log/syslog"

	"github.com/sirupsen/logrus"
	logrus_syslog "github.com/sirupsen/logrus/hooks/syslog"
)

// LoggerOptions is a struct with the options for initializing the logger.
type LoggerOptions struct {
	Syslog bool
}

// SetupLogger configures the logger.
func SetupLogger(opts LoggerOptions) {
	if opts.Syslog {
		hook, err := logrus_syslog.NewSyslogHook("", "", syslog.LOG_INFO, "cozy-apps-registry")
		if err == nil {
			logrus.AddHook(hook)
			logrus.SetOutput(ioutil.Discard)
		}
	}
}
