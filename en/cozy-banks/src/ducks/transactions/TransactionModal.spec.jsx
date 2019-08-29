/* global mount */

import React from 'react'
import { DumbTransactionModal as TransactionModal } from './TransactionModal'
import data from '../../../test/fixtures'
import AppLike from 'test/AppLike'
import store, { normalizeData } from 'test/store'
import pretty from 'pretty'
import getClient from 'test/client'
import pick from 'lodash/pick'

const allTransactions = data['io.cozy.bank.operations']

describe('transaction modal', () => {
  let client
  beforeEach(() => {
    client = getClient()
    const documents = normalizeData(
      pick(data, 'io.cozy.bank.operations', 'io.cozy.bank.accounts')
    )
    jest
      .spyOn(client, 'getDocumentFromState')
      .mockImplementation((doctype, id) => {
        return documents[doctype][id]
      })
  })
  it('should render correctly', () => {
    // need to fix number of the account otherwise its randomly
    // set by the fixture
    const transaction = {
      ...allTransactions[0],
      _id: '2',
      _type: 'io.cozy.bank.operations'
    }

    const root = mount(
      <AppLike store={store} client={client}>
        <TransactionModal
          transactionId={transaction._id}
          transaction={client.hydrateDocument(transaction)}
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
