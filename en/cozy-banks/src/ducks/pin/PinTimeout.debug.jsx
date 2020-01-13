import React from 'react'

const redAffixStyle = {
  color: 'white',
  background: 'crimson',
  borderRadius: 4,
  position: 'fixed',
  top: 0,
  zIndex: 100000
}

export const RedAffix = props => {
  return <div style={redAffixStyle}>{props.children}</div>
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
    const delta = ((duration - (Date.now() - start)) / 1000).toFixed(0)
    return <span>{delta}s</span>
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
