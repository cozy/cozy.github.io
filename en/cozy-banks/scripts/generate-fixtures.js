const faker = require('faker')
const fs = require('fs')
const { ArgumentParser } = require('argparse')

const categoryTree = JSON.parse(
  fs.readFileSync('./src/ducks/categories/tree.json')
)

const oneOf = range => {
  const n = range.length
  return () => range[Math.floor(Math.random() * n)]
}

// In place
const shuffle = list => list.sort(() => Math.floor(Math.random()))

const uniqueOneOf = (range, fail = true) => {
  const stack = shuffle([...range])
  return () => {
    if (stack.length === 0) {
      if (fail) {
        throw new Error('Cannot get a new value, uniqueOneOf list is exhausted')
      } else {
        return null
      }
    }

    return stack.pop()
  }
}

const combinations = (l1, l2) => {
  const res = []
  for (let item1 of l1) {
    for (let item2 of l2) {
      res.push([item1, item2])
    }
  }
  return res
}

const accountType = oneOf(['Saving', 'Checkings'])
const bank = oneOf([
  {
    institutionLabel: 'BNPP',
    createdByApp: 'bnpparibas82'
  },
  {
    institutionLabel: "Caisse d'Epargne",
    createdByApp: 'caissedepargne1'
  },
  {
    institutionLabel: 'Revolut',
    createdByApp: 'revolut'
  }
])
const accountId = uniqueOneOf(
  combinations(['isa', 'cla', 'lou', 'gen', 'foo'], '0123456789'.split('')).map(
    ([x, y]) => `${x}${y}`
  )
)

const billDatatype = {
  vendor: oneOf(['Harmonie', 'CPAM']),
  subtype: oneOf(['VIR COMPL SANTE', 'CPAM PARIS']),
  amount: oneOf([18.5, 30, 70]),
  type: oneOf(['healthExpenses']),
  app: oneOf(['harmonie', 'free', 'sfr'])
}

const genBankAccount = () => {
  const accountBank = bank()
  return {
    _id: accountId(),
    label: faker.finance.accountName(),
    institutionLabel: accountBank.institutionLabel,
    type: accountType(),
    number: faker.finance.account(),
    balance: faker.datatype.number(50000),
    cozyMetadata: {
      createdByApp: accountBank.createdByApp,
      updatedByApp: accountBank.createdByApp,
      createdAt: faker.date
        .between(new Date(2000, 0, 0), new Date())
        .toISOString(),
      updatedAt: faker.date
        .between(new Date(2000, 0, 0), new Date())
        .toISOString()
    }
  }
}

const maybe = (gen, threshold = 0.5, defaultValue = null) => {
  const r = Math.random()
  return 1 - r > threshold ? gen() : defaultValue
}

const makeBankTransactionGen = (bankAccounts, bills, categoryTree) => {
  const accountGen = oneOf(bankAccounts)
  const billGen = uniqueOneOf(bills, false)
  const genCategoryId = oneOf(Object.keys(categoryTree))
  return () => {
    const account = accountGen()
    return {
      account: account._id,
      amount: faker.datatype.number(1000) - 500,
      manualCategoryId: genCategoryId(),
      currency: '€',
      label: faker.finance.transactionDescription(),
      date: faker.date.between(new Date(2000, 0, 0), new Date()).toISOString(),
      bill: maybe(billGen, 0.01),
      cozyMetadata: {
        createdByApp: account.cozyMetadata.createdByApp,
        updatedByApp: account.cozyMetadata.updatedByApp,
        createdAt: faker.date
          .between(new Date(2000, 0, 0), new Date())
          .toISOString(),
        updatedAt: faker.date
          .between(new Date(2000, 0, 0), new Date())
          .toISOString()
      }
    }
  }
}

const genBill = () => {
  return {
    _id: faker.datatype.uuid(),
    vendor: billDatatype.vendor(),
    subtype: billDatatype.subtype(),
    amount: billDatatype.amount(),
    isRefund: faker.datatype.boolean,
    date: faker.date.between(new Date(2000, 0, 0), new Date()).toISOString(),
    type: billDatatype.type(),
    cozyMetadata: {
      createdByApp: billDatatype.app(),
      updatedByApp: billDatatype.app(),
      createdAt: faker.date
        .between(new Date(2000, 0, 0), new Date())
        .toISOString(),
      updatedAt: faker.date
        .between(new Date(2000, 0, 0), new Date())
        .toISOString()
    }
  }
}

const makeBankGroups = (accounts, maxNbAccount) => {
  return () => {
    const words = faker.random.words()
    const randomAccounts = shuffle([...accounts]).slice(
      0,
      Math.floor(Math.random() * maxNbAccount)
    )
    return {
      _id: faker.datatype.uuid(),
      accounts: randomAccounts.map(x => x._id),
      id: words.toLowerCase().replace(/[^a-z]/g, ''),
      label: words
    }
  }
}

const generate = (type, n) => {
  return Array(n).fill(null).map(type)
}

const generateFixtures = ({
  nbAccounts,
  nbBills,
  nbGroups,
  nbOperations,
  maxNbAccountPerGroup
}) => {
  const bankAccounts = generate(genBankAccount, nbAccounts)
  const bills = generate(genBill, nbBills)
  const genGroups = makeBankGroups(bankAccounts, maxNbAccountPerGroup)
  const genBankTransaction = makeBankTransactionGen(
    bankAccounts,
    bills,
    categoryTree
  )
  const bankTransactions = generate(genBankTransaction, nbOperations)
  const bankGroups = generate(genGroups, nbGroups)
  return {
    'io.cozy.bills': bills,
    'io.cozy.bank.accounts': bankAccounts,
    'io.cozy.bank.operations': bankTransactions,
    'io.cozy.bank.groups': bankGroups
  }
}

const main = () => {
  const presets = {
    l: {
      nbAccounts: 50,
      nbBills: 1000,
      nbGroups: 15,
      nbOperations: 6 * 365 * 10,
      maxNbAccountPerGroup: 5
    },
    m: {
      nbAccounts: 10,
      nbOperations: 3 * 365 * 10,
      nbGroups: 3,
      nbBills: 100,
      maxNbAccountPerGroup: 5
    }
  }
  const parser = new ArgumentParser()
  parser.addArgument('filename')
  parser.addArgument('--preset', {
    choices: Object.keys(presets),
    defaultValue: 'm'
  })
  const args = parser.parseArgs()
  const preset = presets[args.preset]
  const fixtures = generateFixtures(preset)
  Object.entries(fixtures).forEach(([doctype, docs]) => {
    // eslint-disable-next-line no-console
    console.log(`Generated ${docs.length} ${doctype}`)
  })
  fs.writeFileSync(args.filename, JSON.stringify(fixtures))
  // eslint-disable-next-line no-console
  console.log(`Saved to ${args.filename}`)
}

if (require.main === module) {
  main()
}
