import React from 'react'
import { DumbBillChip } from './BillChip'
import { shallow } from 'enzyme'

jest.mock('ducks/transactions/FileOpener', () => ({ children }) => children)

describe('BillChip', () => {
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

      const t = key => key

      expect(shallow(<DumbBillChip bill={bill} t={t} />).html()).toBe(null)
    })
  })

  it('should render a Chip', () => {
    const bill = {
      _id: 'fakebill',
      invoice: 'io.cozy.files:deadbeef'
    }

    const t = key => key

    const root = shallow(<DumbBillChip bill={bill} t={t} />)
    expect(root).toMatchSnapshot()
  })
})
