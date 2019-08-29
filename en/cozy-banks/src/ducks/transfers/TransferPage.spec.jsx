import React from 'react'
import { shallow } from 'enzyme'
import { TransferError } from 'ducks/transfers/steps/TransferState'
import { TransferPage } from './TransferPage'
import fixtures from '../../../test/fixtures'
import * as transfers from './transfers'

jest.mock('./transfers')

const accounts = fixtures['io.cozy.bank.accounts']
const recipients = [
  {
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
      <TransferPage
        recipients={collection(recipients)}
        accounts={collection(accounts)}
        t={t}
      />
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should handle pass error to TransferError', async () => {
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
