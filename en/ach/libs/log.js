const colors = require('colors')

const green = colors.green
const blue = colors.blue
const gray = colors.gray
const yellow = colors.yellow
const red = colors.red

const writeLnErr = msg => {
  process.stderr.write(msg + '\n')
}

const LEVELS = {
  DEBUG: 3,
  INFO: 2,
  WARN: 1,
  ERROR: 0,
  SUCCESS: 0
}

const level = LEVELS[process.env.LOG_LEVEL || 'INFO']

module.exports = {
  success: function(msg) {
    if (level >= LEVELS.SUCCESS) {
      writeLnErr(green(msg))
    }
  },

  info: function(msg) {
    if (level >= LEVELS.INFO) {
      writeLnErr(blue(msg))
    }
  },

  debug: function(msg) {
    if (level >= LEVELS.DEBUG) {
      writeLnErr(gray(msg))
    }
  },

  warn: function(msg) {
    if (level >= LEVELS.WARN) {
      writeLnErr(yellow(msg))
    }
  },

  error: function(msg) {
    if (level >= LEVELS.ERROR) {
      writeLnErr(red(msg))
    }
  }
}
