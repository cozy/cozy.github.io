/**
 * List all the t calls key argument. When the key argument is not a simple literal, it
 * is replaced by a "*".
 *
 * t('Hello') -> Hello
 * t(`Category.${coucou}`) -> Category.*
 *
 * Is used to detect unused keys in translation files.
 *
 */
const sortBy = function(iterable, fn) {
  const res = iterable.slice()
  res.sort((a, b) => {
    const ra = fn(a)
    const rb = fn(b)
    if (ra > rb) {
      return 1
    } else if (ra < rb) {
      return -1
    } else {
      return 0
    }
  })
  return res
}

const formatKeynode = function(keyNode) {
  if (keyNode.type == 'Literal') {
    return keyNode.value
  } else if (keyNode.type == 'TemplateLiteral') {
    const isExpression = {}
    for (let exp of keyNode.expressions) {
      isExpression[exp.start + ':' + exp.end] = true
    }
    const sortedParts = sortBy(
      keyNode.quasis
        .map(function(x) {
          return Object.assign({}, x, { quasis: true })
        })
        .concat(keyNode.expressions),
      x => x.start
    )
    return sortedParts
      .map(elem => {
        return elem.quasis ? elem.value.raw : '*'
      })
      .join('')
  } else {
    return undefined // throw new Error()
  }
}
export default function transformer(file, api) {
  const j = api.jscodeshift
  const root = j(file.source)
  root.find(j.CallExpression, { callee: { name: 't' } }).forEach(path => {
    const keyNode = path.node.arguments[0]
    const keyNodeStr = formatKeynode(keyNode)
    if (!keyNodeStr) {
      return
    }
    // eslint-disable-next-line no-console
    console.log(file.path + ':' + path.value.loc.start.line, keyNodeStr)
  })

  return root.toSource()
}
