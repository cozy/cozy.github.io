package main

import (
	"io/ioutil"
	"log/syslog"

	"github.com/sirupsen/logrus"
	logrus_syslog "github.com/sirupsen/logrus/hooks/syslog"
)

type LoggerOptions struct {
	Syslog bool
}

func InitLogger(opts LoggerOptions) {
	if opts.Syslog {
		hook, err := logrus_syslog.NewSyslogHook("", "", syslog.LOG_INFO, "cozy-apps-registry")
		if err == nil {
			logrus.AddHook(hook)
			logrus.SetOutput(ioutil.Discard)
		}
	}
}
