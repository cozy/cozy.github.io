import React, { Component } from 'react'
import Hammer from 'hammerjs'
import { withRouter } from 'react-router'

export default ({ getLocation }) => Wrapped =>
  withRouter(
    class extends Component {
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
          const location = getLocation(this.props)
          if (location) {
            this.props.router.push(location)
            ev.preventDefault()
          }
        }
      }

      render() {
        const props = this.props
        return <Wrapped {...props} />
      }
    }
  )
