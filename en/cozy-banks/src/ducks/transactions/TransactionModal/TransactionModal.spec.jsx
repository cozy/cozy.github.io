import React from 'react'
import { render, fireEvent, within } from '@testing-library/react'
import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'
import { format } from 'date-fns'
import { createMockClient } from 'cozy-client'

import AppLike from 'test/AppLike'
import { ACCOUNT_DOCTYPE, TRANSACTION_DOCTYPE } from 'doctypes'
import { TrackerProvider, trackPage } from 'ducks/tracking/browser'
import { getTracker } from 'ducks/tracking/tracker'

import TransactionModal from './TransactionModal'
import { showAlertAfterApplicationDateUpdate } from 'ducks/transactions/TransactionModal/helpers'
import data from 'test/fixtures'
import { getT, enLocaleOption } from 'utils/lang'

jest.mock('hooks/useBankingSlugs', () => {
  return jest.fn().mockImplementation(() => {
    return {
      isBankKonnector: () => true
    }
  })
})

jest.mock('ducks/tracking/tracker', () => {
  const tracker = {
    trackPage: jest.fn(),
    trackEvent: jest.fn()
  }
  return {
    getTracker: () => tracker
  }
})

jest.mock('cozy-ui/transpiled/react/deprecated/Alerter', () => ({
  success: jest.fn()
}))

jest.mock('ducks/transactions/helpers', () => ({
  ...jest.requireActual('ducks/transactions/helpers'),
  getTagsRelationshipByTransaction: jest.fn(() => [])
}))

describe('transaction modal', () => {
  let client
  beforeEach(() => {
    client = createMockClient({
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

  beforeEach(() => {
    const tracker = getTracker()
    tracker.trackPage.mockReset()
  })

  const setup = ({ initialEntries: initialEntries, transactionId } = {}) => {
    const tracker = getTracker()
    const root = render(
      <TrackerProvider value={tracker}>
        <AppLike client={client} initialEntries={initialEntries}>
          <TransactionModal
            transactionId={transactionId || data[TRANSACTION_DOCTYPE][1]._id}
            showCategoryChoice={() => {}}
            requestClose={() => {}}
            urls={{}}
            brands={[]}
          />
        </AppLike>
      </TrackerProvider>
    )
    return { root, tracker }
  }

  // TODO Can be removed when https://github.com/cozy/cozy-ui/issues/1756
  // is solved
  const closeModal = root => {
    const dialogNode = root.getAllByRole('dialog')[0]
    const closeButton = within(dialogNode).getAllByRole('button')[0]
    fireEvent.click(closeButton)
  }

  it('should render correctly', () => {
    trackPage('mon_compte:compte')
    const { root } = setup()
    expect(root.getByText('Occasional transaction')).toBeTruthy()
    expect(root.getByText('Assigned to Aug 2017')).toBeTruthy()
    expect(root.getByText('Edf Particuliers')).toBeTruthy()
    expect(root.getByText('-77,50')).toBeTruthy()
    expect(root.getByText('Saturday 26 August')).toBeTruthy()
  })

  it('should render null if transaction cannot be found in store (happens when transaction just has been deleted)', () => {
    trackPage('mon_compte:compte')
    const { root } = setup({ transactionId: 'not-existing' })
    expect(root.queryByText('Occasional transaction')).toBeFalsy()
  })

  it('should send correct tracking events (balance page)', () => {
    trackPage('mon_compte:compte')
    const { root, tracker } = setup({
      initialEntries: ['/balances/details']
    })
    expect(tracker.trackPage).toHaveBeenCalledWith('mon_compte:depense')
    tracker.trackPage.mockReset()
    closeModal(root)
    expect(tracker.trackPage).toHaveBeenCalledWith('mon_compte:compte')
  })

  it('should send correct tracking events (categories page)', () => {
    trackPage('categories:homeImprovements:details')
    const { root, tracker } = setup({
      initialEntries: ['/analysis/categories']
    })
    expect(tracker.trackPage).toHaveBeenCalledWith(
      'categories:homeImprovements:depense'
    )
    tracker.trackPage.mockReset()
    closeModal(root)
    expect(tracker.trackPage).toHaveBeenCalledWith(
      'categories:homeImprovements:details'
    )
  })
})

describe('change application date alert', () => {
  const t = getT(enLocaleOption)

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
