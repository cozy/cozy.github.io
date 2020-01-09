import React from 'react'
import { mount } from 'enzyme'
import LoanProgress from './LoanProgress'
import { TestI18n } from 'test/AppLike'

describe('when the account has no info about amount', () => {
  it('should render nothing', () => {
    const account = { _id: 'account', type: 'Loan' }
    const root = mount(
      <TestI18n>
        <LoanProgress account={account} />
      </TestI18n>
    )

    expect(root.html()).toBe('')
  })
})
