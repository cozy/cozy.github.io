/* eslint-disable no-console */

const fs = require('fs')
const path = require('path')
const keyBy = require('lodash/keyBy')

const readJSONSync = filename => {
  return JSON.parse(fs.readFileSync(filename))
}
const main = async () => {
  const data = readJSONSync(path.join(__dirname, '../test/fixtures/demo.json'))
  const brands = readJSONSync(
    path.join(__dirname, '../src/ducks/brandDictionary/brands.json')
  )

  const brandsByKonnectorSlug = keyBy(brands, x => x.konnectorSlug)

  let nErrors = 0
  for (let bill of data['io.cozy.bills']) {
    if (bill.vendor && !brandsByKonnectorSlug[bill.vendor]) {
      nErrors += 1
      console.warn(
        bill._id,
        'Unknown vendor',
        bill.vendor,
        '. Check compatibility between brands.json and vendor.json (bill.vendor must map to brand.konnectorSlug)'
      )
    }
  }

  if (nErrors) {
    throw new Error(
      'Warnings when checking fixtures, please check above and fix them.'
    )
  }
}

main().catch(e => {
  console.warn(e)
  process.exit(1)
})
