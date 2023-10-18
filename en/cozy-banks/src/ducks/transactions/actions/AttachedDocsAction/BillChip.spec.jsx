import React from 'react'
import { render } from '@testing-library/react'
import flag from 'cozy-flags'

import AppLike from 'test/AppLike'
import BillChip from './BillChip'
import brands from 'ducks/brandDictionary/brands'
import getClient from 'selectors/getClient'

jest.mock('selectors/getClient', () => jest.fn())
jest.mock('cozy-flags')
jest.mock(
  'ducks/transactions/FileOpener',
  () =>
    ({ children }) =>
      children
)

describe('BillChip', () => {
  getClient.mockReturnValue({
    store: {
      getState: () => ({ brands })
    }
  })
  const setup = ({ bill }) => {
    const root = render(
      <AppLike>
        <BillChip bill={bill} />
      </AppLike>
    )
    return { root }
  }

  afterEach(() => {
    flag.mockReset()
  })

  describe('when the bill has no invoice', () => {
    beforeEach(() => {
      jest.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      // eslint-disable-next-line no-console
      console.warn.mockRestore()
    })

    it('should render nothing', () => {
      const bill = {
        _id: 'fakebill'
      }

      const { root } = setup({ bill })
      expect(root.container.firstChild).toBe(null)
    })
  })

  it('should render a Chip', () => {
    const bill = {
      _id: 'fakebill',
      invoice: 'io.cozy.files:deadbeef'
    }
    const { root } = setup({ bill })
    expect(root.getByText('Invoice')).toBeTruthy()
  })

  it('should not render a Chip for health category if flag activated', () => {
    flag.mockReturnValue(true)

    const bill = {
      _id: 'fakebill',
      invoice: 'io.cozy.files:deadbeef',
      vendor: 'alan'
    }
    const { root } = setup({ bill })
    expect(root.queryByText('Alan invoice')).toBeNull()
  })

  it('should render a Chip for health category if flag not activated', () => {
    flag.mockReturnValue(false)

    const bill = {
      _id: 'fakebill',
      invoice: 'io.cozy.files:deadbeef',
      vendor: 'alan'
    }
    const { root } = setup({ bill })
    expect(root.queryByText('Alan invoice')).not.toBeNull()
  })

  it('should render a Chip for refunds', () => {
    const bill = {
      _id: 'fakebill',
      invoice: 'io.cozy.files:deadbeef',
      vendor: 'EDF',
      isRefund: true,
      amount: 12
    }
    const { root } = setup({ bill })
    expect(root.getByText('EDF')).toBeTruthy()
    expect(root.getByText('+12,00')).toBeTruthy()
  })
})
