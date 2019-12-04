import { mount } from 'enzyme'
import React from 'react'
import fixtures from 'test/fixtures/unit-tests'
import Row from 'components/Row'
import { TestI18n } from 'test/AppLike'
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
      <TestI18n>
        <AccountGroupChoice
          onChoose={() => {}}
          groups={groups}
          accounts={accounts}
        />
      </TestI18n>
    )
    return { root }
  }

  it('should show groups and accounts', () => {
    const { root } = setup({
      groups: fakeCol(fixtures['io.cozy.bank.groups']),
      accounts: fakeCol(fixtures['io.cozy.bank.accounts'])
    })
    expect(root.find(Row).length).toBe(10)
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
    expect(root.find(Row).length).toBe(3)
  })
})
