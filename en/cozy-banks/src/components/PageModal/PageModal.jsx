import React from 'react'
import { withBreakpoints, Modal } from 'cozy-ui/transpiled/react'
import Page from 'components/PageModal/Page'

/**
 * This component renders a `Modal` on tablet and desktop viewports, and a
 * `Page` on mobile viewports. A `Page` is a special kind of fullscreen `Modal`
 * that shows the mobile bottom navigation bar when it's visible.
 *
 * `PageModal` takes the same props as
 * [cozy-ui's Modal](https://docs.cozy.io/cozy-ui/react/#modal).
 */
export const DumbPageModal = props => {
  const {
    breakpoints: { isMobile },
    ...rest
  } = props

  const Component = isMobile ? Page : Modal

  return <Component {...rest} />
}

export default withBreakpoints()(DumbPageModal)
