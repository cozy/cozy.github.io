import React from 'react'
import { shallow } from 'enzyme'
import { DumbPageModal } from './PageModal'

describe('PageModal', () => {
  it('should render a Modal on tablet/desktop', () => {
    const breakpoints = { isMobile: false }

    const el = shallow(
      <DumbPageModal breakpoints={breakpoints} title="Hello world">
        This is a page modal
      </DumbPageModal>
    ).getElement()

    expect(el).toMatchSnapshot()
  })

  it('should render a Page on mobile', () => {
    const breakpoints = { isMobile: true }

    const el = shallow(
      <DumbPageModal breakpoints={breakpoints} title="Hello world">
        This is a page modal
      </DumbPageModal>
    ).getElement()

    expect(el).toMatchSnapshot()
  })
})
