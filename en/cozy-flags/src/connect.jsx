import React from 'react'
import flag from './flag'

/**
 * Connects a component to the flags. The wrapped component
 * will be refreshed when a flag changes.
 */
const connect = Component => {
  class Wrapped extends React.Component {
    constructor(props) {
      super(props)
      this.handleChange = this.handleChange.bind(this)
    }
    componentDidMount() {
      flag.store.on('change', this.handleChange)
    }
    componentWillUnmount() {
      flag.store.removeListener('change', this.handleChange)
    }
    handleChange() {
      this.forceUpdate()
    }
    render() {
      return <Component {...this.props} />
    }
  }
  Wrapped.displayName = 'flag_' + Component.displayName
  return Wrapped
}

export default connect
