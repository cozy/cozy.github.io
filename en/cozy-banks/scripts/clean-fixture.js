const fs = require('fs')
const { ArgumentParser } = require('argparse')
const omit = require('lodash/omit')

const main = async () => {
  const parser = new ArgumentParser({
    description: 'Given a JSON fixture file containing operations, will remove unnecessary attributes from the operations. The file is overwritten. Other doctypes are untouched.'
  })
  parser.addArgument('filename', { help: 'File containing operations (result of ACH export io.cozy.bank.operations)' })
  const { filename } = parser.parseArgs()

  const data = JSON.parse(fs.readFileSync(filename).toString())
  const updatedData = {
     ...data,
    'io.cozy.bank.operations': data['io.cozy.bank.operations'].map(op =>
      omit(op, [
        'deleted',
        'isActivate',
        'isComing',
        'rawDate',
        'realisationDate',
        'cozyMetadata',
        'relationships',
        'account',
        'isActive',
        'toCategorize',
        'valueDate',
        'sourceCategoryId'
      ])
    ),
  }
  fs.writeFileSync(filename, JSON.stringify(updatedData, null, 2))
}

if (require.main === module) {
  main().catch(e => {
    // eslint-disable-next-line no-console
    console.error(e)
    process.exit(1)
  })
}
