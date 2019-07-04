const flagCallFinder = name => ({
  callee: { name: 'flag' },
  arguments: [{ value: name }]
})

/** Returns true if path is Program or a Block */
const isBlockLike = path => {
  return path.value && path.value.length !== undefined && path.name === 'body'
}

const countJSX = (root, j) => {
  return root.find(j.JSXOpeningElement).length
}

/** Removes unused imports by counting usage */
const removeUnusedImports = (root, j) => {
  const importsToRemove = root.find(j.ImportDeclaration)
  importsToRemove.forEach(path => {
    const toKeep = []
    for (let specifier of path.node.specifiers) {
      const identifierName = specifier.local.name
      const usages = root.find(j.Identifier, { name: identifierName })
      const nUsage =
        usages.size() + (identifierName === 'React' ? countJSX(root, j) : 0)
      // import { toto } from 'lib' counts as 2 usages of toto
      // import toto from 'lib' counts a 1 usage of toto
      const importUsages =
        specifier.type === 'ImportSpecifier'
          ? specifier.imported.name === specifier.local.name
            ? 2
            : 1
          : 1
      if (nUsage > importUsages) {
        toKeep.push(specifier)
      }
    }
    if (toKeep.length === 0 && path.node.specifiers.length > 0) {
      path.replace(null)
    } else {
      path.node.specifiers = toKeep
    }
  })
}

/** Replace without keeping blocks, flattening the newNode into path */
const flatReplace = (path, newNode) => {
  if (
    newNode &&
    newNode.type === 'BlockStatement' &&
    isBlockLike(path.parentPath)
  ) {
    const node = path.parentPath.value.find(n => n === path.node)
    const index = path.parentPath.value.indexOf(node)
    path.parentPath.value.splice(index, 0, ...newNode.body)
    path.replace(null)
  } else {
    path.replace(newNode)
  }
}

const simplifyConditions = (root, j) => {
  // Unary expressions with true/false
  for (let v of [true, false]) {
    root
      .find(j.UnaryExpression, {
        operator: '!',
        argument: { value: v }
      })
      .forEach(path => {
        path.replace(v ? j.literal(false) : j.literal(true))
      })
  }

  // Binary expressions with true/false
  for (let v of [true, false]) {
    for (let operator of ['&&', '||']) {
      for (let dir of ['left', 'right']) {
        const otherDir = dir === 'left' ? 'right' : 'left'
        const exps = root.find(j.LogicalExpression, {
          [dir]: { value: v },
          operator: operator
        })
        exps.forEach(exp => {
          if (operator == '&&') {
            exp.replace(v ? exp.node[otherDir] : exp.node[dir])
          } else {
            exp.replace(exp.node[otherDir])
          }
        })
      }
    }
  }

  // Simplify ternary conditions
  for (let v of [true, false]) {
    const conditionals = root.find(j.ConditionalExpression, {
      test: { value: v }
    })
    conditionals.forEach(conditional => {
      conditional.replace(
        v ? conditional.node.consequent : conditional.node.alternate
      )
    })
  }

  // Simplify ifs
  for (let v of [true, false]) {
    const ifs = root.find(j.IfStatement, { test: { value: v } })
    ifs.forEach(ifStatement => {
      flatReplace(
        ifStatement,
        v ? ifStatement.node.consequent : ifStatement.node.alternate
      )
    })
  }
}

module.exports = function transformer(file, api) {
  const j = api.jscodeshift
  const root = j(file.source)

  // Replace flags by true
  const flagName =
    typeof process !== 'undefined' ? process.env.FLAG : 'reimbursement-tag'
  const flags = root.find(j.CallExpression, flagCallFinder(flagName))
  flags.forEach(flagCall => {
    flagCall.replace(j.literal(true))
  })

  simplifyConditions(root, j)
  removeUnusedImports(root, j)

  return root.toSource()
}
