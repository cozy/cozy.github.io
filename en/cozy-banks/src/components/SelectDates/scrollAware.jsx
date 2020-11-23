import React, { Component } from 'react'
import throttle from 'lodash/throttle'

const getMain = () => document
const getScrollingElement = node =>
  node === document && node.scrollingElement ? node.scrollingElement : node

/**
 * HOC to provide info to the `Wrapped` component
 * about the scrolling state of `<main />`. If we are
 * not at the top, the component will have its prop `scrolling`
 * set to true. It is useful when the children wants to apply
 * a class only we are not at the top.
 */
export default Wrapped =>
  class _ScrollAwareWrapper extends Component {
    state = { scrolling: false }

    componentDidMount() {
      const main = getMain()
      main.addEventListener('scroll', this.onScroll)
    }

    componentWillUnmount() {
      const main = getMain()
      main.removeEventListener('scroll', this.onScroll)
    }

    onScroll = throttle(ev => {
      const node = getScrollingElement(ev.target)
      const scrollTop = node.scrollTop
      const { scrolling } = this.state
      if (scrollTop > 0 && !scrolling) {
        this.setState({ scrolling: true })
      } else if (scrollTop === 0 && scrolling) {
        this.setState({ scrolling: false })
      }
    }, 16)

    render() {
      const props = this.props
      const { scrolling } = this.state
      return <Wrapped {...props} scrolling={scrolling} />
    }
  }
