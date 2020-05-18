const fs = require('fs')
const keyBy = require('lodash/keyBy')

const parseOperation = line => {
  const [vendorId, vendorAccountId, label, amount] = line.split(',')
  return {
    vendorId,
    vendorAccountId,
    label,
    amount: parseInt(amount, 10)
  }
}

const parseAccount = line => {
  const [vendorId, label] = line.split(',')
  return {
    vendorId,
    label
  }
}

const makeCSVParser = parseLine => filename => {
  const lines = fs
    .readFileSync(filename)
    .toString()
    .split('\n')
  return lines.slice(1).map(parseLine)
}

const parseAccountsFromFile = makeCSVParser(parseAccount)
const parseOperationsFromFile = makeCSVParser(parseOperation)

const main = () => {
  const accountsFilename = process.argv[2]
  const operationsFilename = process.argv[3]

  const accounts = parseAccountsFromFile(accountsFilename).filter(
    x => x.vendorId
  )
  const operations = parseOperationsFromFile(operationsFilename).filter(
    x => x.vendorId
  )

  // Operations must be linked to accounts via the account id
  // The account id is only known when we insert data in the Cozy.
  // This is why we use the {{ reference }} syntax understood by ACH
  // to reference to get the _id of the account that has been inserted
  const accountWithIndexByVendorId = keyBy(
    accounts.map((account, index) => {
      return { account, index }
    }),
    accountWithIndex => accountWithIndex.account.vendorId
  )

  operations.forEach(operation => {
    const accountIndex =
      accountWithIndexByVendorId[operation.vendorAccountId].index
    operation.account = `{{reference 'io.cozy.bank.accounts' ${accountIndex} '_id' }}`
  })

  const data = {
    'io.cozy.bank.accounts': accounts,
    'io.cozy.bank.operations': operations
  }
  console.log(JSON.stringify(data, null, 2))
}

if (require.main === module) {
  main()
}
