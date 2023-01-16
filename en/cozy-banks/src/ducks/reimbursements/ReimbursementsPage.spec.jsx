import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { createMockClient } from 'cozy-client/dist/mock'

import AppLike from 'test/AppLike'
import getClient from 'selectors/getClient'
import MockDate from 'mockdate'
import { findSelectDatesInput } from 'test/selectDates'
import ReimbursementsPage from './ReimbursementsPage'

MockDate.set('2021-05-12')

// We are not interested in the behavior of the Reimbursements
// component here, it is tested in Reimbursements.spec.kjsx
jest.mock('ducks/reimbursements/Reimbursements', () => () => null)

jest.mock('selectors/getClient', () => jest.fn())

jest.mock('ducks/filters/useFilteringDoc', () => () => ({
  _type: 'io.cozy.bank.accounts',
  _id: '1337'
}))

describe('reimbursements page', () => {
  it('should be rendered correctly', () => {
    const client = createMockClient({
      queries: {}
    })
    getClient.mockReturnValue(client)
    jest.spyOn(client.store, 'dispatch')
    const root = render(
      <AppLike client={client}>
        <ReimbursementsPage />
      </AppLike>
    )
    expect(findSelectDatesInput(root).map(n => n.textContent)).toEqual([
      '2021',
      'May'
    ])
    const prevButton = root.getByLabelText('Previous month')
    fireEvent.click(prevButton)
    expect(client.store.dispatch).toHaveBeenCalledWith({
      type: 'FILTER_BY_PERIOD',
      period: '2021-04'
    })
  })
})
