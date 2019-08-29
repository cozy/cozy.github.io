import React from 'react'
import { AccountLine } from './GroupSettings'
import Toggle from 'cozy-ui/react/Toggle'
import { mount } from 'enzyme'
import AppLike from 'test/AppLike'
import fixtures from 'test/fixtures'
import { keyBy } from 'lodash'

describe('GroupSettings', () => {
  it('Should call existsById with an id when rendering an account line', () => {
    const group = fixtures['io.cozy.bank.groups'][0]
    const accountsById = keyBy(fixtures['io.cozy.bank.accounts'], '_id')
    const existsById = jest.fn()
    group.accounts = {
      data: group.accounts.map(accountId => accountsById[accountId]),
      existsById
    }
    const account = fixtures['io.cozy.bank.accounts'][0]
    const toggleAccount = jest.fn()

    const root = mount(
      <AppLike>
        <AccountLine
          account={account}
          group={group}
          toggleAccount={toggleAccount}
        />
      </AppLike>
    )

    const toggles = root.find(Toggle)
    toggles.at(0).simulate('click')

    expect(existsById).toHaveBeenCalledWith(account._id)
  })
})
