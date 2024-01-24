import React, { useEffect } from 'react'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

const useScrollToOnMount = (node, scrollTop, scrollLeft) => {
  useEffect(
    () => {
      if (node && scrollTop !== undefined) {
        node.scrollTop = scrollTop
      }
      if (node && scrollLeft !== undefined) {
        node.scrollLeft = scrollLeft
      }
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
}

const getMainNode = isMobile => {
  return isMobile
    ? document.scrollingElement || document.documentElement
    : document.querySelector('[role="main"]')
}

/**
 * Decorates a components so that it scrolls to the top of the main
 * scrolling container when mounted.
 */
const ScrollToTopOnMountWrapper = ({ children }) => {
  const breakpoints = useBreakpoints()
  const node = getMainNode(breakpoints.isMobile)
  useScrollToOnMount(node, 0)
  return <>{children}</>
}

export default ScrollToTopOnMountWrapper
