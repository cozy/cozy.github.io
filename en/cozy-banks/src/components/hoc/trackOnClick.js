import React from 'react'
import { connect } from 'react-redux'
import { trackEvent } from 'actions'
/**
 * Higher order components that adds an onClick to the
 * wrapped component that will send a tracking event
 * via dispatch.
 *
 * @param  {function} getTrackingEvent - How to create the tracking event from props
 * @param  {Component} Component - Component to wrap
 * @return {Component} - Wrapped component
 */
export default getTrackingEvent => Component => {
  const Wrapped = class _TrackOnClickWrapper extends Component {
    constructor(props) {
      super(props)
      this.onClick = this.onClick.bind(this)
    }

    onClick(ev) {
      this.props.dispatch(trackEvent(getTrackingEvent(this.props)))
      if (this.props.onClick) {
        this.props.onClick(ev)
      }
    }

    render(props) {
      return <Component {...props} onClick={this.onClick} />
    }
  }
  return connect()(Wrapped)
}
