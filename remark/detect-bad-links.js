const path = require('path')
const visit = require('unist-util-visit')

const linkShouldGoToDocs = url => {
  const [base, fragment] = url.split('#')
  return base.startsWith('https://github.com/cozy/') && base.endsWith('.md')
}
/**
 * Remark plugin to detect links that should go to docs.cozy.io
 *
 * @param {Object} options - Options passed to the plugin
 */
const detectBadLinks = options => {
  return transformer

  function transformer(tree, file) {
    visit(tree, 'link', visitor)

    function visitor(node) {
      if (linkShouldGoToDocs(node.url)) {
        file.message(`Link should target docs.cozy.io ${node.url}`, node)
      }
    }
  }
}

module.exports = detectBadLinks
