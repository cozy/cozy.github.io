/**
 * Smooth out discrepancies between window and other DOM nodes scroll
 * management.
 */

export const getScroll = node => {
  return node === window
    ? window.pageYOffset || document.documentElement.scrollTop
    : node.scrollTop
}

export const setScroll = (node, scroll) => {
  if (node === window) {
    node.scrollTo(0, scroll)
  } else {
    node.scrollTop = scroll
  }
}

export const getScrollHeight = node => {
  if (node === window) {
    const el =
      window.document.scrollingElement || window.document.documentElement
    return el.getBoundingClientRect().height
  } else if (node) {
    return node.scrollHeight
  } else {
    throw new Error('getScrollHeight: no scrolling element !')
  }
}
