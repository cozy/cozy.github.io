import React from 'react'

export const withContext = Context => Component => {
  class Wrapped extends React.Component {
    render() {
      return (
        <Context.Consumer>
          {context => <Component {...context} {...this.props} />}
        </Context.Consumer>
      )
    }
  }
  Wrapped.displayName = `withContext[${Context.name}](${
    Component.displayName || Component.name
  })`
  return Wrapped
}

export default withContext
