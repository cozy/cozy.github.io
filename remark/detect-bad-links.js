const path = require('path')
const visit = require('unist-util-visit')

const shouldLinkGoToDocsCozyIO = url => {
  const [base, fragment] = url.split('#')
  return base.startsWith('https://github.com/cozy/') && base.endsWith('.md') && base.includes('/blob/master')
}

const updateURLToDocsCozyIO = url => {
  const [base, fragment] = url.split('#')
  const newURL = base
    .replace('https://github.com/cozy/', 'https://docs.cozy.io/en/')
    .replace('/blob/master', '')
    .replace(/\.md$/, '')
    .replace('cozy-stack/docs', 'cozy-stack')
    .replace('cozy-konnector-libs/packages/cozy-konnector-libs/docs', 'cozy-konnector-libs')
    .replace(/\/README$/i, '')
  return newURL + '/' + (fragment ? `#${fragment}` : '')
}
/**
 * Remark plugin to detect links that should go to docs.cozy.io
 *
 * @param {Object} options - Options passed to the plugin
 */
const detectBadLinks = (options = {}) => {
  return transformer

  function transformer(tree, file) {
    visit(tree, 'link', visitor)

    function visitor(node) {
      if (!shouldLinkGoToDocsCozyIO(node.url)) {
        return
      }

      if (options.fix) {
        node.url = updateURLToDocsCozyIO(node.url)
        return node
      } else{
        file.message(`Link should target docs.cozy.io ${node.url}`, node)
      }
    }
  }
}

module.exports = detectBadLinks
