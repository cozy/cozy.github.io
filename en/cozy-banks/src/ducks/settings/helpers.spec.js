import React from 'react'
import { mount } from 'enzyme'
import fixtures from 'test/fixtures/unit-tests.json'
import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'

import AppLike from 'test/AppLike'
import { createClientWithData } from 'test/client'

import { fetchSettings, withAccountOrGroupLabeller } from './helpers'

describe('defaulted settings', () => {
  it('should return defaulted settings', async () => {
    const fakeClient = {
      find: () => {},
      query: () => {
        return Promise.resolve({
          data: [
            {
              pin: '1234'
            },
            {
              notifications: {
                balanceLower: {
                  value: 600,
                  enabled: false
                }
              }
            }
          ]
        })
      }
    }
    const settings = await fetchSettings(fakeClient)
    expect(settings).toMatchSnapshot()
  })
})

describe('withAccountOrGroupLabeller', () => {
  const setup = ({ accountOrGroup }) => {
    const client = createClientWithData({
      queries: {
        groups: {
          doctype: GROUP_DOCTYPE,
          data: fixtures[GROUP_DOCTYPE]
        },
        accounts: {
          doctype: ACCOUNT_DOCTYPE,
          data: fixtures[ACCOUNT_DOCTYPE]
        }
      }
    })

    const DumbComponent = ({ accountOrGroup, getAccountOrGroupLabel }) => {
      return <div>{getAccountOrGroupLabel(accountOrGroup)}</div>
    }

    const Component = withAccountOrGroupLabeller('getAccountOrGroupLabel')(
      DumbComponent
    )

    const root = mount(
      <AppLike client={client} store={client.store}>
        <Component accountOrGroup={accountOrGroup} />
      </AppLike>
    )
    return { root }
  }

  it('should correctly name an account', () => {
    const { root } = setup({
      accountOrGroup: {
        _id: 'compteisa1',
        _type: ACCOUNT_DOCTYPE
      }
    })
    expect(root.text()).toBe('Compte courant Isabelle')
  })

  it('should correctly name a group', () => {
    const ENLARGED_FAMILY_GROUP_ID = 'f1d11eb324b64d604cbeee734e77de66'
    const { root } = setup({
      accountOrGroup: {
        _id: ENLARGED_FAMILY_GROUP_ID,
        _type: GROUP_DOCTYPE
      }
    })
    expect(root.text()).toBe('Famille élargie')
  })

  it('should correctly name an autogroup', () => {
    const { root } = setup({
      accountOrGroup: {
        _id: 'autogroup1',
        _type: GROUP_DOCTYPE
      }
    })
    expect(root.text()).toBe('Checking accounts')
  })
})
