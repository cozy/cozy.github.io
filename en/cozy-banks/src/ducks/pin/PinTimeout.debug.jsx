import React from 'react'

export const RedAffix = props => {
  return (
    <div style={{ background: 'red', position: 'fixed', top: 0, zIndex: 1000 }}>
      {props.children}
    </div>
  )
}

export class Timeout extends React.Component {
  constructor(props) {
    super(props)
    this.update = this.update.bind(this)
  }

  componentDidMount() {
    this.interval = setInterval(this.update, 1000)
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  update() {
    this.setState({})
  }

  render() {
    const { duration, start } = this.props
    return <span>{duration - (Date.now() - start)}</span>
  }
}

const PinTimeout = props => {
  return (
    <RedAffix>
      <Timeout start={props.start} duration={props.duration} />
    </RedAffix>
  )
}

export default PinTimeout
