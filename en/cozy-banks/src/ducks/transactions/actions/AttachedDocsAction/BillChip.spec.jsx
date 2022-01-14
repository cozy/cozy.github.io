import React from 'react'
import { render } from '@testing-library/react'
import AppLike from 'test/AppLike'
import BillChip from './BillChip'

jest.mock(
  'ducks/transactions/FileOpener',
  () =>
    ({ children }) =>
      children
)

describe('BillChip', () => {
  const setup = ({ bill }) => {
    const root = render(
      <AppLike>
        <BillChip bill={bill} />
      </AppLike>
    )
    return { root }
  }
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
    expect(root.getByText('+12.00')).toBeTruthy()
  })
})
