const Handlebars = require('handlebars')
const overEvery = require('lodash/overEvery')
const fromPairs = require('lodash/fromPairs')
const layouts = require('handlebars-layouts')

layouts.register(Handlebars)

const isOfType = type => node => {
  return node.type == type
}

const isPath = path => node => {
  return node.path.original == path
}

const isExtendBlock = overEvery([isOfType('BlockStatement'), isPath('extend')])
const isContentBlock = overEvery([
  isOfType('BlockStatement'),
  isPath('content')
])

/**
 * Extracts the name of extending template.
 * Extracts the AST of each content block.
 */
const extractInfo = templateContent => {
  const ast = Handlebars.parse(templateContent)
  const extendNode = ast.body.find(isExtendBlock)
  const contentNodes = extendNode.program.body.filter(isContentBlock)

  // Mapping from content block name to content block AST
  const contents = fromPairs(
    contentNodes.map(node => [node.params[0].value, node.program])
  )
  return {
    parentTemplate: extendNode.params[0].value,
    parts: contents,
    ast
  }
}

/**
 * Is used to replace parts of a template by rendered content.
 *
 * @param {Object} blocks - Block name -> Block AST
 * @param {Object} replacements - Block name -> Rendered content
 *
 * @example
 * ```
 * {{#content "emailSubtitle"}}
 *   {{#each transactions as |transaction| }}
 *     <div>{{ transaction.label }}</div>
 *   {{/each}}
 * {{/content}}
 *
 * becomes
 *
 * {{#content "emailSubtitle"}}
 *   <div>{{ transaction.label }}</div>
 *   <div>{{ transaction.label }}</div>
 * {{/content}}
 * ```
 */
const replaceParts = (blocks, replacements) => {
  for (const [blockName, replacement] of Object.entries(replacements)) {
    blocks[blockName].body = [
      {
        type: 'ContentStatement',
        original: replacement,
        value: replacement
      }
    ]
  }
}

module.exports = {
  extractInfo,
  replaceParts
}
