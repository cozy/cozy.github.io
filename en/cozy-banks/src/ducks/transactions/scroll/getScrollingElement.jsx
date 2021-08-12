export const DESKTOP_SCROLLING_ELEMENT_CLASSNAME = 'js-scrolling-element'

const getScrollingElement = isDesktop => {
  return isDesktop
    ? document.querySelector(`.${DESKTOP_SCROLLING_ELEMENT_CLASSNAME}`)
    : window
}

export default getScrollingElement
