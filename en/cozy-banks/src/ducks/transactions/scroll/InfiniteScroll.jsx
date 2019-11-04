import React from 'react'
import { debounce, throttle } from 'lodash'
import ReactDOM from 'react-dom'
import { getScroll, getScrollHeight } from 'ducks/transactions/scroll/utils'

function elementInViewport(el, thresold) {
  if (!el) {
    return false
  }
  const bcr = el.getBoundingClientRect()
  const top = bcr.top + thresold
  const viewportTop = window.pageYOffset
  const viewportBottom = viewportTop + window.innerHeight
  return top >= viewportTop && top <= viewportBottom
}

class InfiniteScroll extends React.Component {
  constructor(props) {
    super(props)
    // We deactivate the leading call to avoid layout trashing during
    // componentDidMount/componentDidUpdate
    this.checkForLimits = throttle(this.checkForLimits.bind(this), 100, {
      leading: false
    })
    this.onWindowResize = debounce(this.onWindowResize.bind(this), 500)
  }

  componentDidMount() {
    this.scrollingElement = this.getScrollingElement()
    this.listenToScroll()
    this.checkForLimits()
    window.addEventListener('resize', this.onWindowResize)
  }

  componentWillUnmount() {
    this.stopListeningToScroll()
    window.removeEventListener('resize', this.onWindowResize)
    this.unmounted = true
  }

  onWindowResize() {
    // scrolling element may have changed
    this.stopListeningToScroll()
    this.listenToScroll()
  }

  getScrollingElement() {
    return this.props.getScrollingElement.apply(this)
  }

  componentDidUpdate(prevProps) {
    if (prevProps.children !== this.props.children) {
      this.checkForLimits()
    }
  }

  listenToScroll() {
    if (!this.scrollingElement) {
      throw new Error(
        'getScrollingElement returned null, make sure it returns a node.'
      )
    }
    this.scrollingElement.addEventListener('scroll', this.handleScroll, {
      passive: true
    })
  }

  stopListeningToScroll() {
    if (this.scrollingElement) {
      this.scrollingElement.removeEventListener('scroll', this.handleScroll)
    }
  }

  getScroll = () => {
    const node = this.getScrollingElement()
    return getScroll(node)
  }

  handleScroll = () => {
    if (this.props.onScroll) {
      this.props.onScroll(this.getScrollInfo)
    }
    this.checkForLimits()
  }

  getScrollInfo = () => {
    return {
      scroll: this.getScroll(),
      scrollHeight: this.getScrollHeight()
    }
  }

  getScrollHeight() {
    return getScrollHeight(this.scrollingElement)
  }

  checkForLimits() {
    if (this.props.manual) {
      return
    }
    const reachingTop = elementInViewport(
      this.limitMinRef,
      -this.props.thresoldTop
    )
    const reachingBottom = elementInViewport(
      this.limitMaxRef,
      this.props.thresoldBottom
    )
    const canLoadAtTop = this.props.canLoadAtTop
    const canLoadAtBottom = this.props.canLoadAtBottom
    if (reachingTop && canLoadAtTop) {
      this.props.onReachTop()
    } else if (reachingBottom && canLoadAtBottom) {
      this.props.onReachBottom()
    }
  }

  render() {
    return (
      <React.Fragment>
        <div ref={ref => (this.limitMinRef = ref)} />
        {this.props.children}
        <div ref={ref => (this.limitMaxRef = ref)} />
      </React.Fragment>
    )
  }
}

InfiniteScroll.defaultProps = {
  thresoldTop: 100,
  thresoldBottom: -100,
  thresoldForInfiniteScrollTop: 150,
  getScrollingElement: function() {
    return ReactDOM.findDOMNode(this) // eslint-disable-line
  }
}

export default InfiniteScroll
