/* global mount */

import React from 'react'
import { DumbTransactionModal as TransactionModal } from './TransactionModal'
import data from '../../../test/fixtures'
import AppLike from 'test/AppLike'
import pretty from 'pretty'
import { createClientWithData } from 'test/client'
import { ACCOUNT_DOCTYPE, TRANSACTION_DOCTYPE } from 'doctypes'

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
