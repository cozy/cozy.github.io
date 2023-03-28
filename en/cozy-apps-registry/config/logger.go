package config

import (
	"io"
	"io/ioutil"
	stdlog "log"
	"log/syslog"

	"github.com/go-redis/redis/v7"
	"github.com/sirupsen/logrus"
	logrus_syslog "github.com/sirupsen/logrus/hooks/syslog"
)

// LoggerOptions is a struct with the options for initializing the logger.
type LoggerOptions struct {
	Syslog bool
}

// SetupLogger configures the logger.
func SetupLogger(opts LoggerOptions) {
	var w io.Writer
	// Not closing w as it should be kept open until process dies

	if opts.Syslog {
		hook, err := logrus_syslog.NewSyslogHook("", "", syslog.LOG_INFO, "cozy-apps-registry")
		if err == nil {
			logrus.AddHook(hook)
			logrus.SetOutput(ioutil.Discard)
		}
		w = logrus.WithField("nspace", "go-redis").Writer()
	} else {
		w = io.Discard
	}

	redis.SetLogger(stdlog.New(w, "", 0))
}
