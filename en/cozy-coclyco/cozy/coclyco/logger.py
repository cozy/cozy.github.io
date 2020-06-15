import logging
import os


class Logger:
    class _ColorizedFormatter(logging.Formatter):
        COLORS = {
            logging.FATAL: "\x1b[0;37;41m",
            logging.ERROR: "\x1b[0;31;49m",
            logging.WARNING: "\x1b[0;33;49m",
            logging.INFO: "\x1b[0;94;49m",
            logging.DEBUG: "\x1b[0;90;49m"
        }

        TEXT = {
            logging.FATAL: "FTL",
            logging.ERROR: "ERR",
            logging.WARNING: "WRN",
            logging.INFO: "INF",
            logging.DEBUG: "DBG"
        }

        def format(self, record):
            level = record.levelno
            color = Logger._ColorizedFormatter.COLORS[level]

            level = Logger._ColorizedFormatter.TEXT[level]
            message = record.getMessage()
            return "[%(color)s%(level)3s\x1b[0m] %(message)s" % {"color": color,
                                                                 "level": level,
                                                                 "message": message}

    console = logging.StreamHandler()
    console.setFormatter(_ColorizedFormatter())

    level = os.getenv('LOG', 'info').upper()
    level = logging.getLevelName(level)

    __logger = logging.getLogger("cozy")
    __logger.addHandler(console)
    __logger.setLevel(level)
    __logger.propagate = False

    @staticmethod
    def level(level):
        Logger.__logger.setLevel(level.upper())

    @staticmethod
    def exception(*args, **kwargs):
        Logger.__logger.critical(*args, **kwargs)
        message, *args = args
        raise Exception(message % tuple(args))

    @staticmethod
    def critical(*args, **kwargs):
        Logger.__logger.critical(*args, **kwargs)

    @staticmethod
    def error(*args, **kwargs):
        Logger.__logger.error(*args, **kwargs)

    @staticmethod
    def warning(*args, **kwargs):
        Logger.__logger.warning(*args, **kwargs)

    @staticmethod
    def info(*args, **kwargs):
        Logger.__logger.info(*args, **kwargs)

    @staticmethod
    def debug(*args, **kwargs):
        Logger.__logger.debug(*args, **kwargs)

    @staticmethod
    def log(level, *args, **kwargs):
        level = logging.getLevelName(level.upper())
        Logger.__logger.log(level, *args, **kwargs)
