import React from 'react'
import { render } from '@testing-library/react'

import { createMockClient } from 'cozy-client/dist/mock'
import AppLike from 'test/AppLike'
import { IDENTITIES_DOCTYPE } from 'doctypes'

import PersonalInfoGate from './PersonalInfoGate'

jest.mock('hooks/useBankingSlugs', () => {
  return jest.fn().mockImplementation(() => {
    return {
      isBankKonnector: () => true,
      isBankTrigger: () => true,
      bankingSlugs: []
    }
  })
})

jest.mock('cozy-flags', () => flagName => {
  if (flagName == 'banks.transfers.need-personal-information') {
    return true
  }
  return false
})

describe('PersonalInfoGate', () => {
  const setup = ({ identityData }) => {
    const client = createMockClient({
      queries: {
        'current-app-identity': {
          doctype: IDENTITIES_DOCTYPE,
          data: [identityData]
        }
      }
    })
    const root = render(
      <AppLike client={client}>
        <PersonalInfoGate>
          <div></div>
        </PersonalInfoGate>
      </AppLike>
    )
    return { root, client }
  }

  it('should not show dialog if enough info', () => {
    const { root } = setup({
      identityData: {
        _id: '123',
        contact: {
          birthcity: 'Compiègne',
          nationalities: 'FR'
        }
      }
    })
    expect(root.queryByText('Nationality')).toBeFalsy()
  })

  it('should show dialog if not enough info', () => {
    const { root } = setup({
      identityData: {
        _id: '123',
        contact: {
          birthcity: 'Compiègne'
        }
      }
    })
    expect(root.queryByText('Edit personal information')).toBeTruthy()
  })
})
