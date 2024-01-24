import { mount } from 'enzyme'
import React from 'react'
import fixtures from 'test/fixtures/unit-tests'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import AppLike from 'test/AppLike'
import { DumbAccountGroupChoice as AccountGroupChoice } from './AccountGroupChoice'

jest.mock('components/AccountIcon', () => () => null)

const fakeCol = data => ({
  data,
  isLoading: false,
  lastUpdate: new Date()
})

describe('AccountGroupChoice', () => {
  const setup = ({ accounts, groups }) => {
    const root = mount(
      <AppLike>
        <AccountGroupChoice
          onSelect={() => {}}
          groups={groups}
          accounts={accounts}
        />
      </AppLike>
    )
    return { root }
  }

  it('should show groups and accounts', () => {
    const { root } = setup({
      groups: fakeCol(fixtures['io.cozy.bank.groups']),
      accounts: fakeCol(fixtures['io.cozy.bank.accounts'])
    })
    expect(root.find(ListItem).length).toBe(11)
  })

  it('should work with virtual groups', () => {
    const { root } = setup({
      groups: fakeCol([
        fixtures['io.cozy.bank.groups'][0],
        {
          ...fixtures['io.cozy.bank.groups'][0],
          _id: 'virtualGroup_c0ffeedeadbeef',
          virtual: true
        }
      ]),
      accounts: fakeCol([])
    })
    expect(root.find(ListItem).length).toBe(3)
  })
})
