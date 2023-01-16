import React from 'react'
import AccountsList from './AccountsList'
import { render } from '@testing-library/react'
import AppLike from 'test/AppLike'
import { createMockClient } from 'cozy-client/dist/mock'
import { schema } from 'doctypes'
jest.mock('./AccountRow', () => {
  const AccountRow = ({ account }) => {
    return <div id={account._id}>{account.label}</div>
  }

  return AccountRow
})

const setup = ({ group, accounts }) => {
  const client = createMockClient({
    clientOptions: {
      schema
    },
    queries: {
      accounts: {
        doctype: 'io.cozy.bank.accounts',
        data: accounts
      }
    }
  })
  const filterByDoc = jest.fn()
  client.ensureStore()
  const root = render(
    <AppLike client={client} store={client.store}>
      <AccountsList
        filterByDoc={filterByDoc}
        group={group}
        switches={{
          a1: { checked: true, disabled: false },
          a2: { checked: true, disabled: false },
          a3: { checked: true, disabled: false }
        }}
      />
    </AppLike>
  )

  const elements = [...root.container.querySelectorAll('[id]')]
  const ids = elements.map(el => el.id)

  return { ids, root }
}

describe('AccountsList', () => {
  describe('when given a normal group', () => {
    const accounts = [
      { _id: 'a1', label: 'Account 1', balance: 1000 },
      { _id: 'a2', label: 'Account 2', balance: -200 },
      { _id: 'a3', label: 'Account 3', balance: 500 }
    ]

    const group = {
      _id: 'group',
      accounts: {
        data: accounts
      }
    }

    it('should render accounts by ascending balance', () => {
      const { ids } = setup({ group, accounts })
      expect(ids).toEqual(['a2', 'a3', 'a1'])
    })
  })

  describe('when given the reimbursements virtual groups', () => {
    const accounts = [
      { _id: 'a1', label: 'Account 1', balance: 1000 },
      { _id: 'a2', label: 'Account 2', balance: -200 },
      { _id: 'a3', label: 'Account 3', balance: 500 }
    ]

    const group = {
      _id: 'Reimbursements',
      virtual: true,
      accounts: {
        data: accounts
      }
    }

    it('should render accounts in their actual order', () => {
      const { ids } = setup({ group, accounts })
      expect(ids).toEqual(['a1', 'a2', 'a3'])
    })
  })

  it('should render accounts which has not done status (case when importing data)', () => {
    const accounts = [
      { _id: 'a1', label: 'Account 1', balance: 1000, status: 'done' },
      { _id: 'a2', label: 'Account 2', balance: -200 },
      { _id: 'a3', label: 'Account 3', balance: 500, status: 'done' }
    ]

    const group = {
      _id: 'Reimbursements',
      virtual: true,
      accounts: {
        data: accounts
      }
    }

    const { root } = setup({ group, accounts })
    expect(root.queryByText('Account 1')).toBeFalsy()
    expect(root.getByText('Account 2')).toBeTruthy()
    expect(root.queryByText('Account 3')).toBeFalsy()
  })
})
