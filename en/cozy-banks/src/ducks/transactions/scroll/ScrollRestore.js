import React from 'react'
import {
  getScroll,
  setScroll,
  getScrollHeight
} from 'ducks/transactions/scroll/utils'

class ScrollRestore extends React.Component {
  UNSAFE_componentWillUpdate(nextProps) {
    if (this.props.shouldRestore(this.props, nextProps)) {
      this.restoreScroll = this.getRestoreScroll()
    }
  }

  componentDidUpdate() {
    if (this.restoreScroll) {
      this.restoreScroll()
      this.restoreScroll = null
    }
  }

  getRestoreScroll() {
    // Save scroll position to restore it later
    const scrollNode = this.props.getScrollingElement()
    const height = getScrollHeight(scrollNode)
    const scroll = getScroll(scrollNode)
    return function () {
      const newHeight = getScrollHeight(scrollNode)
      const newScroll = scroll + (newHeight - height)
      setScroll(scrollNode, newScroll)
    }
  }

  render() {
    return this.props.children
  }
}

export default ScrollRestore
