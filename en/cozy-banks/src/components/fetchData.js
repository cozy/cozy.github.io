import React, { Component } from 'react'
import Spinner from 'cozy-ui/react/Spinner'
import DisplayError from 'components/DisplayError'

/**
  Higher order component to wait for a promise
  before displaying the real component.
*/
export default fetch => WrappedComponent => {
  class Wrapper extends Component {
    componentDidMount() {
      this.setState({ hasData: false, hasError: false })
      fetch(this.props).then(
        data => this.setState({ hasData: true, data }),
        error => this.setState({ hasError: true, error })
      )
    }

    render(props, { hasData, data, hasError, error }) {
      if (hasError) {
        return <DisplayError error={error} />
      } else if (!hasData) {
        return (
          <div>
            <Spinner />
          </div>
        )
      } else {
        return <WrappedComponent {...props} {...data} />
      }
    }
  }

  try {
    Object.defineProperty(Wrapper, 'name', {
      value: `${Component.name} [from fetchData]`
    })
    // eslint-disable-next-line no-empty
  } catch (e) {}

  return Wrapper
}
