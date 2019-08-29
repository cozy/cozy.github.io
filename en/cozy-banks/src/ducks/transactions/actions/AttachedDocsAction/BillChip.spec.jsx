import React from 'react'
import { DumbBillChip } from './BillChip'
import { shallow } from 'enzyme'

describe('BillChip', () => {
  it('should render nothing if the given bill has no invoice', () => {
    const bill = { _id: 'fakebill' }

    const t = key => key

    expect(shallow(<DumbBillChip bill={bill} t={t} />).html()).toBe(null)
  })
})
