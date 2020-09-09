import React from 'react'
import { DumbAccountsList } from './AccountsList'
import { render } from '@testing-library/react'
import AppLike from 'test/AppLike'
import { createMockClient } from 'cozy-client/dist/mock'

jest.mock('./AccountRow', () => {
  const AccountRow = ({ account }) => {
    return <div id={account._id}>{account.label}</div>
  }

  return AccountRow
})

const setup = ({ group, accounts }) => {
  const client = createMockClient({
    queries: {
      accounts: {
        doctype: 'io.cozy.bank.accounts',
        data: accounts
      }
    }
  })
  const router = { push: jest.fn() }
  const filterByDoc = jest.fn()
  client.ensureStore()
  const { container } = render(
    <AppLike client={client} store={client.store}>
      <DumbAccountsList
        router={router}
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

  const elements = [...container.querySelectorAll('[id]')]
  const ids = elements.map(el => el.id)

  return ids
}

describe('DumbAccountsList', () => {
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
      const ids = setup({ group, accounts })
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
      const ids = setup({ group, accounts })
      expect(ids).toEqual(['a1', 'a2', 'a3'])
    })
  })
})
