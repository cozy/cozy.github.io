import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import throttle from 'lodash/throttle'

const withSize = () => Wrapped => {
  class WithSize extends Component {
    constructor(props, context) {
      super(props, context)
      this.handleResize = throttle(this.handleResize.bind(this), 200)
      this.state = { size: {} }
    }

    componentDidMount() {
      this.handleResize()
      window.addEventListener('resize', this.handleResize)
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.handleResize)
    }

    handleResize() {
      // eslint-disable-next-line react/no-find-dom-node
      const node = ReactDOM.findDOMNode(this)
      this.setState({ size: node.getBoundingClientRect() })
    }

    render() {
      return <Wrapped {...this.props} size={this.state.size} />
    }
  }

  WithSize.displayName = `withSize(${Wrapped.displayName || Wrapped.name})`

  return WithSize
}

export default withSize
