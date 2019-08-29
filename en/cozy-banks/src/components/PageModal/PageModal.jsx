import React from 'react'
import { withBreakpoints } from 'cozy-ui/react'
import PageModalMobile from 'components/PageModal/PageModalMobile'
import PageModalDesktop from 'components/PageModal/PageModalDesktop'

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

  const Component = isMobile ? PageModalMobile : PageModalDesktop

  return <Component {...rest} />
}

export default withBreakpoints()(DumbPageModal)
