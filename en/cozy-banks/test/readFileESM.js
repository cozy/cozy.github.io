module.exports = {
  process: function (fileContent) {
    // Code was copy/paste from the output of babel-cli when writing
    // export default {}
    // It enables Jest to import text modules like Handlebars template
    // as ES modules.
    return `
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = \`${fileContent}\`
    `
  }
}
