import { Buffer } from 'buffer'
import { Stream } from 'stream'
import { createFormatStream, transactionsToCSV } from './services'

const setup = () => {
  const accounts = {
    checkings: {
      id: '19e2519131deafeb36dad340765635ac',
      _id: '19e2519131deafeb36dad340765635ac',
      institutionLabel: 'Société Générale',
      label: 'Compte Courant',
      number: '00031738274',
      type: 'Checkings'
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
      manualLabel: 'Abonnement Gaz'
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
      currency: 'EUR',
      date: '2021-09-10T12:00:00.000Z',
      label: 'GAZ',
      originalBankLabel: 'PRLV SEPA GAZ',
      realisationDate: '2021-09-10T12:00:00.000Z',
      applicationDate: '2021-09-10T12:00:00.000Z',
      recurrence: {
        data: recurrences.gaz
      },
      tags: {}
    },
    {
      _id: '0008d7b9134d67cb079d10acc530902f',
      id: '0008d7b9134d67cb079d10acc530902f',
      account: {
        data: accounts.checkings
      },
      amount: 78.3,
      cozyCategoryId: '400840',
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
      }
    },
    {
      _id: '0008d7b9134d67cb079d10acc530902f',
      id: '0008d7b9134d67cb079d10acc530902f',
      account: {
        data: accounts.checkings
      },
      amount: -78.3,
      cozyCategoryId: '400840',
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
      }
    },
    {
      _id: '000dcebc4d23ebd5bd68a16c38d5fe63',
      id: '000dcebc4d23ebd5bd68a16c38d5fe63',
      amount: 1.5,
      cozyCategoryId: '400110',
      currency: 'EUR',
      date: '2021-12-24T12:00:00.000Z',
      label: 'BOULANGERIE AU BON PAIN',
      originalBankLabel: 'BOULANGERIE AU BON PAIN Card.***4',
      realisationDate: '2021-12-24T12:00:00.000Z',
      type: 'credit card'
    }
  ]

  return { transactions }
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
      undefined,
      'Société Générale',
      'Compte Courant',
      '00031738274',
      'Checkings',
      'Abonnement Gaz',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
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
        '"Date";"Realisation date";"Assigned date";"Label";"Original bank label";"Category name";"Amount";"Currency";"Type";"Reimbursement status";"Bank name";"Account name";"Account number";"Account type";"Recurrence name";"Tag 1";"Tag 2";"Tag 3";"Tag 4";"Tag 5"',
        '"2021-09-10";"2021-09-10";"";"GAZ";"PRLV SEPA GAZ";"power";"-63";"EUR";"";"";"Société Générale";"Compte Courant";"00031738274";"Checkings";"Abonnement Gaz";"";"";"";"";""'
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
      '2021-09-10',
      'GAZ',
      'PRLV SEPA GAZ',
      'power',
      -63,
      'EUR',
      undefined,
      undefined,
      'Société Générale',
      'Compte Courant',
      '00031738274',
      'Checkings',
      'Abonnement Gaz',
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
      undefined,
      'Société Générale',
      'Compte Courant',
      '00031738274',
      'Checkings',
      undefined,
      'Vacances à Melun',
      'Vacances',
      'Remboursements',
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
      'reimbursed',
      'Société Générale',
      'Compte Courant',
      '00031738274',
      'Checkings',
      undefined,
      'Vacances à Melun',
      'Vacances',
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
      'supermarket',
      1.5,
      'EUR',
      'credit card',
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
      undefined
    ])
  })
})
