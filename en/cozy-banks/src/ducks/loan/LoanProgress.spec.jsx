import React from 'react'
import { mount } from 'enzyme'
import LoanProgress from './LoanProgress'

describe('when the account has no info about amount', () => {
  it('should render nothing', () => {
    const account = { _id: 'account', type: 'Loan' }
    const root = mount(<LoanProgress t={key => key} account={account} />)

    expect(root.html()).toBe('')
  })
})
