/* global mount */

import React from 'react'
import BarBalance from '.'
import Figure from 'cozy-ui/transpiled/react/Figure'
import data from '../../../test/fixtures'

describe('BarBalance', () => {
  it('should render correctly', () => {
    const root = mount(<BarBalance accounts={data['io.cozy.bank.accounts']} />)
    expect(root.find(Figure).props('total')['total']).toBeCloseTo(42963, 0)
  })
})
