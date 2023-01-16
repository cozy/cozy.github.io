import React, { Component } from 'react'
import { useNavigate } from 'react-router-dom'
import Hammer from 'hammerjs'

class BackSwipe extends Component {
  componentDidMount() {
    const node = document.body
    this.hammer = new Hammer.Manager(node, {
      recognizers: [[Hammer.Swipe, { direction: Hammer.DIRECTION_RIGHT }]]
    })
    this.hammer.on('swiperight', this.onSwipeRight)
  }

  componentWillUnmount() {
    this.hammer.destroy()
  }

  onSwipeRight = ev => {
    if (!ev.defaultPrevented) {
      const location = this.props.getLocation(this.props)
      if (location) {
        this.props.navigate(location)
        ev.preventDefault()
      }
    }
  }

  render() {
    return this.props.children
  }
}

const BackSwipeWrapper = ({ getLocation, children }) => {
  const navigate = useNavigate()
  return (
    <BackSwipe getLocation={getLocation} navigate={navigate}>
      {children}
    </BackSwipe>
  )
}

export default BackSwipeWrapper
