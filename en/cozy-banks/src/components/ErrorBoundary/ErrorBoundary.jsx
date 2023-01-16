import React from 'react'
import { useLocation } from 'react-router-dom'
import { logException } from 'lib/sentry'
import Error from 'components/ErrorBoundary/Error'

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
    const prevPathname = prevProps.location.pathname
    const pathname = this.props.location.pathname
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

const ErrorBoundaryWrapper = ({ children, ...props }) => {
  const location = useLocation()
  return (
    <ErrorBoundary location={location} {...props}>
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundaryWrapper
