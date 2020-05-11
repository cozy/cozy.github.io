import React from 'react'

const withError = (Component, ErrorComponent) => {
  class Wrapper extends React.Component {
    constructor(props, context) {
      super(props, context)
      this.state = { error: null }
    }

    componentDidCatch(error) {
      this.setState({ error })
    }

    render() {
      const { error } = this.state
      if (this.state.error) {
        return <ErrorComponent error={error} componentProps={this.props} />
      } else {
        return <Component {...this.props} />
      }
    }
  }

  Wrapper.displayName = `withError(${Component.name || Component.displayName})`

  return Wrapper
}

export default withError
