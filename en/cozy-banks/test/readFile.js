module.exports = {
  process: function (fileContent) {
    return `module.exports = \`${fileContent}\``
  }
}
