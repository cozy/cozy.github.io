import React from 'react'
import { logException } from 'lib/sentry'
import Error from 'components/ErrorBoundary/Error'
import get from 'lodash/get'

const getPathname = children => {
  return get(children, 'props.location.pathname')
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    logException({ error, info })
  }

  componentDidUpdate(prevProps) {
    const prevPathname = getPathname(prevProps.children)
    const pathname = getPathname(this.props.children)
    if (this.state.hasError && prevPathname !== pathname) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return <Error />
    }

    return this.props.children
  }
}

export default ErrorBoundary
