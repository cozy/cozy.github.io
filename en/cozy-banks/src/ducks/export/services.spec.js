import { Buffer } from 'buffer'
import { Stream } from 'stream'
import {
  accountsWitoutTransactionsToCSV,
  createFormatStream,
  transactionsToCSV
} from './services'

const setup = () => {
  const accounts = {
    checkings: {
      id: '19e2519131deafeb36dad340765635ac',
      _id: '19e2519131deafeb36dad340765635ac',
      institutionLabel: 'Société Générale',
      label: 'Isabelle Durand Compte Courant',
      shortLabel: 'Compte Courant',
      number: '00031738274',
      originalNumber: '0974200031738274',
      type: 'Checkings',
      balance: 123.4,
      comingBalance: 123.4,
      iban: 'FR65023382980003173827423',
      vendorId: '12345'
    },
    loan: {
      id: '29e2519131deafeb36dad340765635ac',
      _id: '29e2519131deafeb36dad340765635ac',
      institutionLabel: 'Société Générale',
      label: 'Isabelle Durand PRET IMMO',
      shortLabel: 'Pret Immobilier',
      number: 'T00031733728',
      originalNumber: 'T00031733728',
      type: 'Loan',
      balance: -128037.32,
      comingBalance: -128037.32,
      loan: {
        totalAmount: 207200,
        rate: 2.07,
        nextPaymentDate: '2022-01-05T00:00:00.000Z',
        nextPaymentAmount: 1408.75,
        subscriptionDate: '2012-02-11T00:00:00.000Z',
        maturityDate: '2032-03-05T00:00:00.000Z'
      },
      vendorId: '12346'
    }
  }

  const tags = {
    melun: {
      _id: '096893b83548db4f2fed4dfe9abeb8aa',
      id: '096893b83548db4f2fed4dfe9abeb8aa',
      label: 'Vacances à Melun'
    },
    vacances: {
      _id: '06f5ac6635b1534e3ef1c425520d1915',
      id: '06f5ac6635b1534e3ef1c425520d1915',
      label: 'Vacances'
    },
    remboursements: {
      _id: '1a7b9270f3a9a59c4f49301105d699fb',
      id: '1a7b9270f3a9a59c4f49301105d699fb',
      label: 'Remboursements'
    }
  }

  const recurrences = {
    gaz: {
      _id: '5149cf01d4347c53d573b358ee511571',
      id: '5149cf01d4347c53d573b358ee511571',
      accounts: [accounts.checkings],
      amounts: [-54, -63],
      automaticLabel: 'GAZ',
      categoryIds: ['401080'],
      latestAmount: -63,
      latestDate: '2021-09-10T12:00:00.000Z',
      manualLabel: 'Abonnement Gaz',
      stats: { deltas: { median: 58.5 } }
    }
  }

  const transactions = [
    {
      _id: '0008d7b9134d67cb079d10acc530902f',
      id: '0008d7b9134d67cb079d10acc530902f',
      account: {
        data: accounts.checkings
      },
      amount: -63,
      cozyCategoryId: '401080',
      cozyCategoryProba: 1,
      currency: 'EUR',
      date: '2021-09-10T12:00:00.000Z',
      label: 'GAZ',
      originalBankLabel: 'PRLV SEPA GAZ',
      realisationDate: '2021-09-10T12:00:00.000Z',
      applicationDate: '2021-09-10T12:00:00.000Z',
      recurrence: {
        data: recurrences.gaz
      },
      tags: {},
      vendorId: '23456'
    },
    {
      _id: '0008d7b9134d67cb079d10acc530902f',
      id: '0008d7b9134d67cb079d10acc530902f',
      account: {
        data: accounts.checkings
      },
      amount: 78.3,
      cozyCategoryId: '400840',
      cozyCategoryProba: 1,
      currency: 'EUR',
      date: '2021-11-12T12:00:00.000Z',
      label: 'REMBOURSEMENT FACTURE 0001',
      originalBankLabel: 'VIREMENT REMBOURSEMENT FACTURE 0001',
      realisationDate: '2021-11-12T12:00:00.000Z',
      applicationDate: '2021-10-07T12:00:00.000Z',
      type: 'transfer',
      recurrence: {},
      tags: {
        data: [tags.melun, tags.vacances, tags.remboursements]
      },
      vendorId: '23457'
    },
    {
      _id: '0008d7b9134d67cb079d10acc530902f',
      id: '0008d7b9134d67cb079d10acc530902f',
      account: {
        data: accounts.checkings
      },
      amount: -78.3,
      cozyCategoryId: '400840',
      cozyCategoryProba: 1,
      currency: 'EUR',
      date: '2021-10-23T12:00:00.000Z',
      label: 'TRAVEL AGENCY FACTURE 0001',
      originalBankLabel: 'TRAVEL AGENCY FACTURE 0001 Card.***4',
      realisationDate: '2021-10-23T12:00:00.000Z',
      type: 'credit card',
      reimbursementStatus: 'reimbursed',
      recurrence: {},
      tags: {
        data: [tags.melun, tags.vacances]
      },
      vendorId: '23458'
    },
    {
      _id: '000dcebc4d23ebd5bd68a16c38d5fe63',
      id: '000dcebc4d23ebd5bd68a16c38d5fe63',
      amount: 1.5,
      automaticCategoryId: '400110',
      currency: 'EUR',
      date: '2021-12-24T12:00:00.000Z',
      label: 'BOULANGERIE AU BON PAIN',
      originalBankLabel: 'BOULANGERIE AU BON PAIN Card.***4',
      realisationDate: '2021-12-24T12:00:00.000Z',
      isComing: true,
      valueDate: '2021-12-31T12:00:00.000Z',
      type: 'credit card',
      vendorId: '23459'
    }
  ]

  return { accounts, recurrences, tags, transactions }
}

describe('createFormatStream', () => {
  it('returns a Stream', () => {
    const stream = createFormatStream()

    expect(stream).toBeInstanceOf(Stream)
  })

  it('transforms arrays of data into CSV lines', async () => {
    const data = [
      '2021-09-10',
      '2021-09-10',
      undefined,
      'GAZ',
      'PRLV SEPA GAZ',
      'power',
      -63,
      'EUR',
      undefined,
      'no',
      undefined,
      undefined,
      'Société Générale',
      'Isabelle Durand Compte Courant',
      'Compte Courant',
      '00031738274',
      '0974200031738274',
      'Checkings',
      123.4,
      123.4,
      'FR65023382980003173827423',
      undefined,
      'yes',
      'Abonnement Gaz',
      undefined,
      58.5,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      '23456'
    ]

    const stream = createFormatStream()
    stream.write(data)
    stream.end()

    const chunks = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    const output = Buffer.concat(chunks)

    expect(String(output)).toEqual(
      [
        // XXX: The header line is included in the output
        '"Date";"Realisation date";"Assigned date";"Label";"Original bank label";"Category name";"Amount";"Currency";"Type";"Expected?";"Expected debit date";"Reimbursement status";"Bank name";"Account name";"Custom account name";"Account number";"Account originalNumber";"Account type";"Account balance";"Account coming balance";"Account IBAN";"Account vendorDeleted";"Recurrent?";"Recurrence name";"Recurrence status";"Recurrence frequency";"Tag 1";"Tag 2";"Tag 3";"Tag 4";"Tag 5";"Unique ID";"Unique account ID";"Loan amount";"Interest rate";"Next payment date";"Next payment amount";"Subscription date";"Repayment date"',
        '"2021-09-10";"2021-09-10";"";"GAZ";"PRLV SEPA GAZ";"power";"-63";"EUR";"";"no";"";"";"Société Générale";"Isabelle Durand Compte Courant";"Compte Courant";"00031738274";"0974200031738274";"Checkings";"123.4";"123.4";"FR65023382980003173827423";"";"yes";"Abonnement Gaz";"";"58.5";"";"";"";"";"";"23456";"";"";"";"";"";"";""'
      ].join('\n')
    )
  })
})

describe('transactionsToCSV', () => {
  it('returns a generator', () => {
    const generator = transactionsToCSV([])
    expect(generator.__proto__.toString()).toEqual('[object Generator]')
    expect(typeof generator.next).toEqual('function')
  })

  it('transforms the given io.cozy.bank.operations into arrays of data per our CSV schema', () => {
    const { transactions } = setup()

    const generator = transactionsToCSV(transactions)

    expect(generator.next().value).toEqual([
      '2021-09-10',
      '2021-09-10',
      undefined,
      'GAZ',
      'PRLV SEPA GAZ',
      'power',
      -63,
      'EUR',
      undefined,
      'no',
      undefined,
      undefined,
      'Société Générale',
      'Isabelle Durand Compte Courant',
      'Compte Courant',
      '00031738274',
      '0974200031738274',
      'Checkings',
      123.4,
      123.4,
      'FR65023382980003173827423',
      undefined,
      'yes',
      'Abonnement Gaz',
      undefined,
      58.5,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      '23456',
      '12345',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    ])

    expect(generator.next().value).toEqual([
      '2021-11-12',
      '2021-11-12',
      '2021-10-07',
      'REMBOURSEMENT FACTURE 0001',
      'VIREMENT REMBOURSEMENT FACTURE 0001',
      'travel',
      78.3,
      'EUR',
      'transfer',
      'no',
      undefined,
      undefined,
      'Société Générale',
      'Isabelle Durand Compte Courant',
      'Compte Courant',
      '00031738274',
      '0974200031738274',
      'Checkings',
      123.4,
      123.4,
      'FR65023382980003173827423',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'Vacances à Melun',
      'Vacances',
      'Remboursements',
      undefined,
      undefined,
      '23457',
      '12345',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    ])

    expect(generator.next().value).toEqual([
      '2021-10-23',
      '2021-10-23',
      undefined,
      'TRAVEL AGENCY FACTURE 0001',
      'TRAVEL AGENCY FACTURE 0001 Card.***4',
      'travel',
      -78.3,
      'EUR',
      'credit card',
      'no',
      undefined,
      'reimbursed',
      'Société Générale',
      'Isabelle Durand Compte Courant',
      'Compte Courant',
      '00031738274',
      '0974200031738274',
      'Checkings',
      123.4,
      123.4,
      'FR65023382980003173827423',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'Vacances à Melun',
      'Vacances',
      undefined,
      undefined,
      undefined,
      '23458',
      '12345',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    ])

    expect(generator.next().value).toEqual([
      '2021-12-24',
      '2021-12-24',
      undefined,
      'BOULANGERIE AU BON PAIN',
      'BOULANGERIE AU BON PAIN Card.***4',
      'awaiting',
      1.5,
      'EUR',
      'credit card',
      'yes',
      '2021-12-31',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      '23459',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    ])
  })
})

describe('accountsWitoutTransactionsToCSV', () => {
  it('returns a generator', () => {
    const generator = accountsWitoutTransactionsToCSV([])
    expect(generator.__proto__.toString()).toEqual('[object Generator]')
    expect(typeof generator.next).toEqual('function')
  })

  it('transforms the given io.cozy.bank.accounts into arrays of data per our CSV schema', () => {
    const { accounts } = setup()

    const generator = accountsWitoutTransactionsToCSV([accounts.loan])

    expect(generator.next().value).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'Société Générale',
      'Isabelle Durand PRET IMMO',
      'Pret Immobilier',
      'T00031733728',
      'T00031733728',
      'Loan',
      -128037.32,
      -128037.32,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      '12346',
      207200,
      2.07,
      '2022-01-05',
      1408.75,
      '2012-02-11',
      '2032-03-05'
    ])
  })
})
