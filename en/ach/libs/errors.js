class ChainedError extends Error {
  constructor(message, original) {
    super(message)
    this.stack = original.stack + '\n' + this.stack
  }
}

module.exports = {
  ChainedError
}
