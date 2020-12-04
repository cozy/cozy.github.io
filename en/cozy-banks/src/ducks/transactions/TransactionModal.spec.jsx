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
import { TrackerProvider, trackPage } from 'ducks/tracking/browser'
import { getTracker } from 'ducks/tracking/tracker'
import RawContentDialog from 'components/RawContentDialog'

jest.mock('ducks/tracking/tracker', () => {
  const tracker = {
    trackPage: jest.fn(),
    trackEvent: jest.fn()
  }
  return {
    getTracker: () => tracker
  }
})

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

  beforeEach(() => {
    const tracker = getTracker()
    tracker.trackPage.mockReset()
  })

  const setup = ({ router: routerOption } = {}) => {
    const router = routerOption || {
      params: {}
    }
    const tracker = getTracker()
    const root = mount(
      <TrackerProvider value={tracker}>
        <AppLike client={client} router={router}>
          <TransactionModal
            transactionId={data[TRANSACTION_DOCTYPE][1]._id}
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

  const closeModal = root => {
    root
      .find(RawContentDialog)
      .props()
      .onClose()
  }

  it('should render correctly', () => {
    trackPage('mon_compte:compte')
    const { root } = setup()
    expect(pretty(root.html())).toMatchSnapshot()
  })

  it('should send correct tracking events (balance page)', () => {
    trackPage('mon_compte:compte')
    const router = {
      location: {
        pathname: '/balances/details'
      },
      params: {}
    }
    const { root, tracker } = setup({
      router
    })
    expect(tracker.trackPage).toHaveBeenCalledWith('mon_compte:depense')
    tracker.trackPage.mockReset()
    closeModal(root)
    expect(tracker.trackPage).toHaveBeenCalledWith('mon_compte:compte')
  })

  it('should send correct tracking events (categories page)', () => {
    trackPage('categories:homeImprovements:details')
    const router = {
      location: {
        pathname: '/analysis/categories'
      },
      params: {}
    }
    const { root, tracker } = setup({
      router
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
