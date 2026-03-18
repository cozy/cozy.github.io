import fromPairs from 'lodash/fromPairs'
import mapValues from 'lodash/mapValues'

import uiPalette from 'cozy-ui/stylus/settings/palette.styl'

const resolveCSSPropertiesInMapping = cssMapping => {
  return mapValues(cssMapping, value => {
    if (value.startsWith('var(')) {
      return cssMapping[value.slice(4, -1)]
    } else {
      return value
    }
  })
}

/**
 * Crude way to extract a mapping of CSS props to their values.
 */
export const extractCSSProps = content => {
  const lines = content.split('\n')
  return fromPairs(
    lines
      .map(line => line.replace(/;$/g, '').trim())
      .filter(line => line.startsWith('--'))
      .map(line => line.split(/(\s|:)+/))
      .map(parts => parts.map(part => part.trim()).filter(Boolean))
      .filter(arr => arr.length > 1)
      .map(arr => arr.slice(0, 2))
  )
}

export const palette = resolveCSSPropertiesInMapping(extractCSSProps(uiPalette))

/**
 * Replaces var(--red) by #f00 in cssContent if props={'--red': '#f00'}
 *
 * The cozy-ui palette props are automatically added
 *
 * @param  {String} cssContent - CSS String
 * @param  {Object} props      Mapping from css props to value
 * @return {String}            - CSS string with vars resolved
 */
const resolveCSSProperties = (cssContent, props) => {
  const allProps = {
    ...palette,
    ...extractCSSProps(cssContent),
    ...props
  }
  const resolvedProps = resolveCSSPropertiesInMapping(allProps)
  return cssContent.replace(/var\((--.*)\)/g, function (all, varName) {
    if (!resolvedProps[varName]) {
      throw new Error(
        `Could not find var(${varName}). Available vars: ${Object.keys(
          resolvedProps
        ).join(', ')}.`
      )
    }
    return resolvedProps[varName]
  })
}

export { resolveCSSProperties }
