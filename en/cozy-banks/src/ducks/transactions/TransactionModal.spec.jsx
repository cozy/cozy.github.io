/* global mount */

import React from 'react'
import TransactionModal, {
  showAlertAfterApplicationDateUpdate
} from './TransactionModal'
import data from '../../../test/fixtures'
import AppLike from 'test/AppLike'
import pretty from 'pretty'
import { createClientWithData } from 'test/client'
import { ACCOUNT_DOCTYPE, TRANSACTION_DOCTYPE } from 'doctypes'
import Alerter from 'cozy-ui/transpiled/react/Alerter'
import { format } from 'date-fns'
import Polyglot from 'node-polyglot'
import en from 'locales/en.json'

jest.mock('cozy-ui/transpiled/react/Alerter', () => ({
  success: jest.fn()
}))

describe('transaction modal', () => {
  let client
  beforeEach(() => {
    client = createClientWithData({
      queries: {
        transactions: {
          doctype: TRANSACTION_DOCTYPE,
          data: data[TRANSACTION_DOCTYPE]
        },
        accounts: {
          doctype: ACCOUNT_DOCTYPE,
          data: data[ACCOUNT_DOCTYPE]
        }
      }
    })
  })
  it('should render correctly', () => {
    const root = mount(
      <AppLike client={client}>
        <TransactionModal
          transactionId={data[TRANSACTION_DOCTYPE][1]._id}
          showCategoryChoice={() => {}}
          requestClose={() => {}}
          urls={{}}
          brands={[]}
        />
      </AppLike>
    )
    expect(pretty(root.html())).toMatchSnapshot()
  })
})

describe('change application date alert', () => {
  const p = new Polyglot()
  p.extend(en)
  const t = p.t.bind(p)

  beforeEach(() => {
    Alerter.success.mockReset()
  })

  it('should output the correct message', () => {
    showAlertAfterApplicationDateUpdate(
      {
        date: '2019-09-09T12:00'
      },
      t,
      format
    )
    expect(Alerter.success).toHaveBeenCalledWith(
      'Operation assigned to September in the analysis tab'
    )
  })

  it('should output the correct message', () => {
    showAlertAfterApplicationDateUpdate(
      {
        date: '2019-09-09T12:00',
        applicationDate: '2019-08'
      },
      t,
      format
    )
    expect(Alerter.success).toHaveBeenCalledWith(
      'Operation assigned to August in the analysis tab'
    )
  })
})
