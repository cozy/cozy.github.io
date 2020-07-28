import React from 'react'
import { shallow } from 'enzyme'
import { render } from '@testing-library/react'

import { createMockClient } from 'cozy-client/dist/mock'

import AppLike from 'test/AppLike'
import fixtures from 'test/fixtures'

import { accountsConn, recipientsConn, myselfConn } from 'doctypes'
import { TransferError } from 'ducks/transfers/steps/TransferState'
import TransferPage, { TransferPage as DumbTransferPage } from './TransferPage'

import * as transfers from './transfers'

jest.mock('components/Bar', () => {
  const MockBarCenter = ({ children }) => <div>{children}</div>
  return {
    BarCenter: MockBarCenter
  }
})
jest.mock('./transfers')
jest.mock('cozy-flags', () => flagName => {
  if (flagName === 'banks.transfers.need-personal-information') {
    return true
  } else {
    return false
  }
})

const accounts = fixtures['io.cozy.bank.accounts']
const recipients = [
  {
    _id: 'recipient1',
    vendorAccountId: accounts[0].vendorId,
    category: 'internal',
    label: 'Dalai Lama',
    iban: 'TBT13245'
  }
]

const t = x => x
const collection = data => ({ fetchStatus: 'ready', data })

describe('transfer page', () => {
  let root

  beforeEach(() => {
    root = shallow(
      <DumbTransferPage
        breakpoints={{ isMobile: false }}
        recipients={collection(recipients)}
        accounts={collection(accounts)}
        t={t}
      />
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should pass error to TransferError', async () => {
    root.instance().setState({
      senderAccount: accounts[0],
      beneficiary: {
        ...recipients[0],
        recipients: recipients
      }
    })
    jest.spyOn(console, 'error').mockImplementation(() => {})

    const err = new Error('LOGIN_FAILED')
    transfers.createJob.mockRejectedValue(err)
    try {
      await root.instance().transferMoney()
    } catch (e) {
      // eslint-disable-line no-empty
    }
    const errorView = root.find(TransferError)
    expect(errorView.length).toBe(1)
    expect(errorView.props().error).toBe(err)
  })
})

describe('personal info', () => {
  const setup = ({ myselfData } = {}) => {
    const client = createMockClient({
      queries: {
        [recipientsConn.as]: {
          doctype: recipientsConn.query().doctype,
          data: recipients
        },
        [accountsConn.as]: {
          doctype: accountsConn.query().doctype,
          data: accounts
        },
        [myselfConn.as]: {
          doctype: myselfConn.query().doctype,
          data: [
            {
              _id: 'myselfid1234',
              ...myselfData
            }
          ]
        }
      }
    })
    const root = render(
      <AppLike client={client}>
        <TransferPage />
      </AppLike>
    )

    return { root }
  }

  describe('mobile', () => {
    beforeEach(() => {
      window.innerWidth = 300
    })

    it('should show personal info if myself contact not sufficiently filled', async () => {
      const { root } = setup()
      root.findByText('Edit personal information')

      // Transfer stepper is hidden on mobile
      const text = root.queryByText('Where do you want to send this transfer ?')
      expect(text).toBe(null)
    })

    it('should not show personal info if myself contact is sufficiently filled', async () => {
      const { root } = setup({
        myselfData: {
          birthcity: 'Compiègne',
          nationality: 'FR',
          cozyMetadata: {
            updatedByApps: [
              {
                slug: 'slug'
              }
            ]
          }
        }
      })
      // Personal info modal should not be shown
      const personalInfoNode = root.queryByText('Edit personal information')
      expect(personalInfoNode).toBe(null)

      root.findByText('Where do you want to send this transfer ?')
    })
  })

  describe('desktop', () => {
    beforeEach(() => {
      window.innerWidth = 800
    })

    it('should show personal info if myself contact not sufficiently filled', async () => {
      const { root } = setup()
      root.findByText('Edit personal information')

      // Transfer stepper is not hidden on desktop
      const text = root.queryByText('Where do you want to send this transfer ?')
      expect(text).not.toBe(null)
    })

    it('should not show personal info if myself contact is sufficiently filled', async () => {
      const { root } = setup({
        myselfData: {
          birthcity: 'Compiègne',
          nationality: 'FR',
          cozyMetadata: {
            updatedByApps: [
              {
                slug: 'slug'
              }
            ]
          }
        }
      })
      // Personal info modal should not be shown
      const personalInfoNode = root.queryByText('Edit personal information')
      expect(personalInfoNode).toBe(null)

      root.findByText('Where do you want to send this transfer ?')
    })
  })
})
