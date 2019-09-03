module.exports = function assert(c, m) {
  if (!c) {
    throw new Error(m)
  }
}
