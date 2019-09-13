import React, { useEffect } from 'react'
import { withBreakpoints } from 'cozy-ui/react'

const useScrollToTopOnMount = node => {
  useEffect(() => {
    if (node) {
      node.scrollTop = 0
    }
  }, [])
}

/**
 * Decorates a components so that it scrolls to the top of the main
 * scrolling container when mounted.
 */
const scrollToTopOnMount = Component =>
  withBreakpoints()(({ breakpoints, ...props }) => {
    useScrollToTopOnMount(
      breakpoints.isMobile
        ? document.scrollingElement || document.documentElement
        : document.querySelector('[role="main"]')
    )
    return <Component {...props} />
  })

export default scrollToTopOnMount
