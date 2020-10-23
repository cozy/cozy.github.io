import React from 'react'
import { shallow } from 'enzyme'
import PageModal from './PageModal'
import AppLike from 'test/AppLike'

describe('PageModal', () => {
  it('should render a Modal on tablet/desktop', () => {
    const breakpoints = { isMobile: false }

    const el = shallow(
      <AppLike>
        <PageModal breakpoints={breakpoints} title="Hello world">
          This is a page modal
        </PageModal>
      </AppLike>
    ).getElement()

    expect(el).toMatchSnapshot()
  })

  it('should render a Page on mobile', () => {
    const breakpoints = { isMobile: true }

    const el = shallow(
      <AppLike>
        <PageModal breakpoints={breakpoints} title="Hello world">
          This is a page modal
        </PageModal>
      </AppLike>
    ).getElement()

    expect(el).toMatchSnapshot()
  })
})
