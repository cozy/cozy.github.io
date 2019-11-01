const transactions = require('./transactions')

// This test should be reactivated promptly
// Message written 06/03/2018
xdescribe('transactions', () => {
  beforeEach(() => {
    transactions.fetchTransactions = jest.fn()
  })
  it('should be able to fetch for a specific month', () => {
    const dispatch = () => {}
    const getState = () => ({})
    transactions.fetchTransactionsWithState()(dispatch, getState)
    expect(transactions.fetchTransactions).toHaveBeenCalledWith({
      selector: {
        date: {
          $lt: '2013-01',
          $gt: '2012-12'
        }
      }
    })
  })
})
