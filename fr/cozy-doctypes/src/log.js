let logger

const slice = [].slice

module.exports = {
  log: function(level) {
    if (!logger) {
      const method = level === 'debug' ? 'log' : level
      return console[method].apply(console, slice.call(arguments)) // eslint-disable-line no-console
    } else {
      return logger.apply(this, arguments)
    }
  },

  registerLogger: function(_logger) {
    logger = _logger
  }
}
