const { prepareTransactions, treatedByFormat } = require('./utils')

describe('prepareTransactions', () => {
  it('should prepare transactions for the template', function() {
    const transactions = [
      { account: 'isa1', label: '4', date: '2012-08-10' },
      { account: 'isa1', label: '3', date: '2012-08-08' },
      { account: 'isa1', label: '2', date: '2012-08-08' },
      { account: 'isa2', label: '7', date: '2012-08-06' },
      { account: 'isa2', label: '6', date: '2012-08-17' },
      { account: 'isa1', label: '5', date: '2012-08-14' },
      { account: 'isa1', label: '1', date: '2012-08-02' }
    ]

    const prepared = prepareTransactions(transactions)

    // date -> [key, values]
    expect(prepared.isa1[0][0]).toBe('2012-08-14')
    expect(prepared.isa2[0][0]).toBe('2012-08-17')
    expect(prepared.isa1[0][1][0].label).toBe('5')
    expect(prepared.isa1[1][1][0].label).toBe('4')
    expect(prepared.isa1[2][1][0].label).toBe('3')
    expect(prepared.isa1[2][1][1].label).toBe('2')
    expect(prepared.isa1[3][1][0].label).toBe('1')
  })
})

describe('treatedByFormat', () => {
  it('should format correctly when there is one reimbursement', () => {
    const billsById = {
      1: { vendor: 'Vendor 1' }
    }

    const reimbursements = [{ billId: 'io.cozy.bills:1' }]

    expect(treatedByFormat(reimbursements, billsById)).toBe('Vendor 1')
  })

  it('should format correctly when there is multiple reimbursements', () => {
    const billsById = {
      1: { vendor: 'Vendor 1' },
      2: { vendor: 'Vendor 2' }
    }

    const reimbursements = [
      { billId: 'io.cozy.bills:1' },
      { billId: 'io.cozy.bills:2' }
    ]

    expect(treatedByFormat(reimbursements, billsById)).toBe(
      'Vendor 1, Vendor 2'
    )
  })
})
