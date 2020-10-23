import React from 'react'
import { Modal, useBreakpoints } from 'cozy-ui/transpiled/react'
import Page from 'components/PageModal/Page'

/**
 * This component renders a `Modal` on tablet and desktop viewports, and a
 * `Page` on mobile viewports. A `Page` is a special kind of fullscreen `Modal`
 * that shows the mobile bottom navigation bar when it's visible.
 *
 * `PageModal` takes the same props as
 * [cozy-ui's Modal](https://docs.cozy.io/cozy-ui/react/#modal).
 */
const PageModal = props => {
  const { isMobile } = useBreakpoints()
  const { ...rest } = props

  const Component = isMobile ? Page : Modal

  return <Component {...rest} />
}

export default PageModal
