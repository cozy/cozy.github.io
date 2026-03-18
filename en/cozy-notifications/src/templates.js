import Handlebars from 'handlebars'
import layouts from 'handlebars-layouts'
import fromPairs from 'lodash/fromPairs'
import mapValues from 'lodash/mapValues'
import overEvery from 'lodash/overEvery'

import cozyLayout from './cozy-layout.hbs'
import { palette, resolveCSSProperties } from './cssUtils'
import stylesheet from './style.css'

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

const pushAll = (iter, items) => {
  iter.push.apply(iter, items)
}

/**
 * Collect info content and parenting infos from an Handlebars AST.
 * Will go up the chain of templates to collect all content blocks.
 *
 * @typedef {Object} PartialTemplateInfo
 * @property {AST[]} parts - All content blocks ASTs
 * @property {string[]} parents - Chain of parents for `ast`, outermost parent is last
 *
 * @return {PartialTemplateInfo}
 */
export const collectInfo = (templateContent, partials) => {
  const parsedTemplate = Handlebars.parse(templateContent)

  let curBody = parsedTemplate.body
  let contentNodes = []
  let parents = []

  while (curBody) {
    // Add content nodes for current AST
    const extendNode = curBody.find(isExtendBlock)
    const body = extendNode ? extendNode.program.body : curBody
    const currentContentNodes = body.filter(isContentBlock)
    if (!currentContentNodes.length === 0) {
      throw new Error('Did not find any content node')
    }
    pushAll(contentNodes, currentContentNodes)

    // See if we can go upper
    if (!extendNode) {
      curBody = null
    } else {
      // Now go upper
      const parentName = extendNode.params[0].value
      const parent = partials[parentName]
      if (!parent) {
        throw new Error(`Cannot find partial ${parentName}`)
      }
      parents.push(parentName)
      const parentParsed = Handlebars.parse(parent)
      curBody = parentParsed.body
    }
  }

  const contentASTByName = fromPairs(
    contentNodes.map(node => [node.params[0].value, node.program])
  )

  return {
    ast: parsedTemplate,
    contentASTByName,
    parents
  }
}

const createContentBlock = name => {
  if (!name) {
    throw new Error('Must pass "name" to createContentBlock')
  }
  return {
    type: 'BlockStatement',
    path: {
      type: 'PathExpression',
      original: 'content',
      value: 'content',
      parts: ['content']
    },
    params: [
      {
        value: name,
        original: name,
        type: 'StringLiteral'
      }
    ],
    program: {
      type: 'Program'
    }
  }
}

/**
 * Is used to replace content blocks of a template by rendered content.
 * If the replacement does not match an already existing block, it will
 * be inserted in `ast`.
 *
 * @param {Object} ast
 * @param {Object} blocks - Block name -> Block AST (references to part of the AST)
 * @param {Object} replacements - Block name -> Rendered content
 *
 * @example
 * ```
 * const { ast, blocks } = extractInfo(template)
 * injectContent(ast, blocks, { emailSubtitle: 'Content of email subtitle'})
 * ```
 *
 * ```
 * {{#content "emailSubtitle"}}
 *   {{ t('my-email-subtitle') }}
 * {{/content}}
 * ```
 *
 * ```
 * {{#content "emailSubtitle"}}
 *   Content of email subtitle
 * {{/content}}
 * ```
 */
export const injectContent = (ast, replacements) => {
  const root = ast.body.find(isExtendBlock).program
  const contentBlocks = root.body.filter(isContentBlock)

  // Find the content blocks defined in the AST and index them by name
  const contentBlocksByName = fromPairs(
    contentBlocks.map(node => [node.params[0].value, node.program])
  )

  for (const [blockName, replacement] of Object.entries(replacements)) {
    let blockProgram = contentBlocksByName[blockName]

    // The block has not been found in the children template, let's create it.
    // It is for example the case when the content block is defined in
    // a parent template (hence it is not in the children template AST).
    // Since we have it already rendered, it is sufficient to inject directly
    // the content block inside the children template.
    if (!blockProgram) {
      const extendNode = ast.body.find(isExtendBlock)
      const newBlock = createContentBlock(blockName)
      extendNode.program.body.push(newBlock)
      blockProgram = newBlock.program
    }
    blockProgram.body = [
      {
        type: 'ContentStatement',
        original: replacement,
        value: replacement
      }
    ]
  }
}

/**
 * Returns a function that can render a template
 * Pre-compiles partials and registers helpers
 */
export const renderer = ({ partials: userPartials, helpers: userHelpers }) => {
  const allPartials = {
    ...partials,
    ...userPartials
  }
  const allHelpers = {
    ...helpers,
    ...userHelpers
  }
  const h = Handlebars.create()
  layouts.register(h)
  h.registerPartial(mapValues(allPartials, h.compile))
  h.registerHelper(allHelpers)
  return {
    Handlebars: h,
    h,
    render: ({ template, data }) => {
      return twoPhaseRender(h, template, data, allPartials)
    },
    collectInfo: template => {
      return collectInfo(template, allPartials)
    },
    injectContent: injectContent
  }
}

/**
 * Does the two-phase templating that is in preparation for when the stack
 * supports email layouts.
 *
 * The goals is to separate the rendering of each part of the emails from
 * the wrapping inside a built-in template, and the MJML rendering.
 *
 */
export const twoPhaseRender = (
  Handlebars,
  templateRaw,
  templateData,
  partials
) => {
  const { contentASTByName, ast } = collectInfo(templateRaw, partials)

  const renderedContentBlocks = mapValues(contentASTByName, contentAST => {
    const compiledContentBlock = Handlebars.compile(contentAST)
    return compiledContentBlock(templateData)
  })

  // Here we inject rendered content inside the AST so that the template AST
  // does not longer rely on templateData
  injectContent(ast, renderedContentBlocks)

  const fullTemplate = Handlebars.compile(ast)

  // When the stack implement layouts, we will no longer need to render the
  // full template and we will only return the renderedParts for the caller
  // to send them directly to the stack
  const fullContent = fullTemplate()

  return {
    full: fullContent,
    parts: renderedContentBlocks
  }
}

const helpers = {
  palette: varName => {
    const value = palette[varName]
    if (value === undefined) {
      throw new Error(
        `Cannot find ${varName} in palette. Available vars ${Object.keys(
          palette
        ).join(', ')}`
      )
    }
    return value
  },

  stylesheet: (cssPropsOrHOpts, hopts) => {
    const cssProps = hopts === undefined ? {} : cssPropsOrHOpts
    return resolveCSSProperties(stylesheet, cssProps)
  }
}

export const partials = {
  'cozy-layout': cozyLayout
}
