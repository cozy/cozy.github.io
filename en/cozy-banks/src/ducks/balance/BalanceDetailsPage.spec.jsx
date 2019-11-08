import React from 'react'
import { mount } from 'enzyme'
import { RawBalanceDetailsPage } from './BalanceDetailsPage'
import { TransactionsPageWithBackButton } from 'ducks/transactions'
import { LoanDetailsPage, LoanListPage } from 'ducks/loan'
import { ReimbursementsPage } from 'ducks/reimbursements'
import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'
import flag from 'cozy-flags'

jest.mock('ducks/transactions', () => ({
  TransactionsPageWithBackButton: () => 'TransactionsPageWithBackButton'
}))

jest.mock('ducks/loan', () => ({
  LoanDetailsPage: () => 'LoanDetailsPage',
  LoanListPage: () => 'LoanListPage'
}))

jest.mock('ducks/reimbursements', () => ({
  ReimbursementsPage: () => 'ReimbursementsPage'
}))

jest.mock('cozy-flags')

flag.mockImplementation(flag => {
  const enabledFlags = ['loan-details-page']

  return enabledFlags.includes(flag)
})

describe('when the filtering doc is neither a group nor an account', () => {
  const filteringDoc = {}

  it('should show the transactions page', () => {
    const wrapper = mount(<RawBalanceDetailsPage filteringDoc={filteringDoc} />)

    expect(wrapper.find(TransactionsPageWithBackButton)).toHaveLength(1)
  })
})

describe('when the filtering doc is an account', () => {
  const baseFilteringDoc = {
    _id: 'loan',
    _type: ACCOUNT_DOCTYPE
  }

  describe('of type Loan', () => {
    it('should show the loan details page', () => {
      const filteringDoc = {
        ...baseFilteringDoc,
        type: 'Loan'
      }

      const wrapper = mount(
        <RawBalanceDetailsPage filteringDoc={filteringDoc} />
      )

      expect(wrapper.find(LoanDetailsPage)).toHaveLength(1)
    })
  })

  describe('of type Reimbursements', () => {
    it('should show the reimbursements page', () => {
      const filteringDoc = {
        ...baseFilteringDoc,
        type: 'Reimbursements'
      }

      const wrapper = mount(
        <RawBalanceDetailsPage filteringDoc={filteringDoc} />
      )

      expect(wrapper.find(ReimbursementsPage)).toHaveLength(1)
    })
  })

  describe('of any other type', () => {
    it('should show the transactions page', () => {
      const filteringDoc = {
        ...baseFilteringDoc,
        type: 'Checkings'
      }

      const wrapper = mount(
        <RawBalanceDetailsPage filteringDoc={filteringDoc} />
      )

      expect(wrapper.find(TransactionsPageWithBackButton)).toHaveLength(1)
    })
  })
})

describe('when the filtering doc is a group', () => {
  const baseFilteringDoc = {
    _id: 'group',
    _type: GROUP_DOCTYPE
  }

  describe('with only loan accounts', () => {
    const filteringDoc = {
      ...baseFilteringDoc,
      accounts: {
        data: [
          {
            _id: 'account',
            _type: ACCOUNT_DOCTYPE,
            type: 'Loan'
          }
        ]
      }
    }

    it('should show the loan list page', () => {
      const wrapper = mount(
        <RawBalanceDetailsPage filteringDoc={filteringDoc} />
      )

      expect(wrapper.find(LoanListPage)).toHaveLength(1)
    })
  })

  describe('when the group is reimbursement virtual group', () => {
    const filteringDoc = {
      ...baseFilteringDoc,
      _id: 'Reimbursements',
      virtual: true,
      accountType: 'Reimbursements',
      accounts: {
        data: [{ _id: 'health_reimbursements', _type: ACCOUNT_DOCTYPE }]
      }
    }

    it('should show the reimbursements page', () => {
      const wrapper = mount(
        <RawBalanceDetailsPage filteringDoc={filteringDoc} />
      )

      expect(wrapper.find(ReimbursementsPage)).toHaveLength(1)
    })
  })

  describe('without only loan accounts', () => {
    const filteringDoc = {
      ...baseFilteringDoc,
      accounts: {
        data: [{ _id: 'account', _type: ACCOUNT_DOCTYPE, type: 'Checkings' }]
      }
    }

    it('should show the transactions page', () => {
      const wrapper = mount(
        <RawBalanceDetailsPage filteringDoc={filteringDoc} />
      )

      expect(wrapper.find(TransactionsPageWithBackButton)).toHaveLength(1)
    })
  })
})
