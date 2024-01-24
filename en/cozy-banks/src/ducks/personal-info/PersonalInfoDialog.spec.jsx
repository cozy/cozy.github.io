import React from 'react'
import CozyClient from 'cozy-client'
import { render, wait, fireEvent } from '@testing-library/react'
import AppLike from 'test/AppLike'

import PersonalInfoDialog, {
  PersonalInfoDialog as DumbPersonalInfoDialog
} from './PersonalInfoDialog'

jest.mock('hooks/useBankingSlugs', () => {
  return jest.fn().mockImplementation(() => {
    return {
      bankingKonnectors: [],
      isBankKonnector: () => true,
      isBankTrigger: () => true
    }
  })
})

const mockIdentities = [
  {
    _id: 'identity-fr',
    contact: {
      birthcity: 'Compiègne',
      birthcountry: 'France',
      nationalities: ['FR']
    },
    cozyMetadata: {
      createdByApp: 'banks'
    }
  },
  {
    _id: 'identity-br',
    contact: {
      birthcity: 'Sao Paulo',
      birthcountry: 'Brazil',
      nationalities: ['BR']
    }
  }
]

const mockTriggers = [
  {
    current_state: { last_success: '2020-11-05' },
    message: { konnector: 'caissedepargne1' }
  }
]

const mockKonnector = { attributes: { parameters: { bankId: '1' } } }

describe('personal info dialog', () => {
  const setup = () => {
    const client = new CozyClient({})
    client.appMetadata.slug = 'banks'

    client.query = jest.fn().mockImplementation(options => {
      const { doctype, selector } = options
      if (selector && selector['cozyMetadata.createdByApp'] === 'banks') {
        return { data: [mockIdentities[0]] }
      } else if (
        selector &&
        selector['cozyMetadata.createdByApp'] === 'another-app'
      ) {
        return { data: [mockIdentities[1]] }
      } else if (doctype === 'io.cozy.triggers') {
        return {
          data: mockTriggers
        }
      } else if (doctype === 'io.cozy.konnectors') {
        return { data: mockKonnector }
      } else {
        throw new Error('Query call is not mocked')
      }
    })
    client.save = jest.fn().mockImplementation(saved => ({
      data: saved
    }))
    const root = render(
      <AppLike client={client}>
        <PersonalInfoDialog
          sourceIdentitySelectors={[
            ...DumbPersonalInfoDialog.defaultProps.sourceIdentitySelectors,
            { 'cozyMetadata.createdByApp': 'another-app' }
          ]}
          onClose={jest.fn()}
        />
      </AppLike>
    )
    return { client, root }
  }

  it('should display an error if at least one field is not filled', async () => {
    const { root, client } = setup()
    await wait(() => expect(client.query).toHaveBeenCalledTimes(2))
    const inp1 = root.getByPlaceholderText('City where you were born')
    fireEvent.change(inp1, { target: { value: '' } })
    fireEvent.click(root.getByText('Save information').parentNode.parentNode)
    expect(root.getByText('All fields are mandatory')).toBeDefined()
  })

  it('should load the data from several sources', async () => {
    const { root, client } = setup()
    await wait(() => expect(client.query).toHaveBeenCalledTimes(2))
    expect(client.query).toHaveBeenCalledWith(
      expect.objectContaining({
        selector: {
          'cozyMetadata.createdByApp': 'another-app'
        }
      })
    )

    expect(client.query).toHaveBeenCalledWith(
      expect.objectContaining({
        selector: {
          'cozyMetadata.createdByApp': 'banks',
          identifier: 'regulatory-info'
        }
      })
    )
    expect(root.getByText('Birth city')).toBeTruthy()
    expect(root.getByText('Birth country')).toBeTruthy()
    expect(root.getByText('Nationality')).toBeTruthy()

    const inp1 = root.getByPlaceholderText('City where you were born')
    const inp2 = root.getByPlaceholderText('Country where you were born')
    expect(inp1.value).toEqual('Sao Paulo')
    expect(inp2.value).toEqual('Brazil')
  })

  it('should save form info inside the apps io.cozy.identities and on budget-insight', async () => {
    const { root, client } = setup()
    await wait(() => expect(client.query).toHaveBeenCalledTimes(2))
    const inp1 = root.getByPlaceholderText('City where you were born')
    const inp2 = root.getByPlaceholderText('Country where you were born')
    fireEvent.change(inp1, { target: { value: 'Douarnenez' } })
    fireEvent.change(inp2, { target: { value: 'Brazil' } })
    expect(inp1.value).toEqual('Douarnenez')
    expect(inp2.value).toEqual('Brazil')
    fireEvent.click(root.getByText('Save information').parentNode.parentNode)
    expect(client.save).toHaveBeenCalledTimes(1)
    expect(client.save).toHaveBeenCalledWith({
      _type: 'io.cozy.identities',
      _id: 'identity-fr', // Check that the correct identity is updated
      contact: {
        birthcity: 'Douarnenez',
        birthcountry: 'Brazil',
        nationalities: ['BR']
      },
      identifier: 'regulatory-info',
      cozyMetadata: {
        createdByApp: 'banks'
      }
    })
  })
})
