import React from 'react'
import flag from './flag'

const FlagInput = ({ name, onChange }) => {
  return (
    <input
      type="checkbox"
      checked={flag(name)}
      onChange={ev =>
        flag(name, JSON.parse(ev.target.checked)) && onChange && onChange()
      }
    />
  )
}

const FoldButton = ({ children, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'absolute',
        top: '100%',
        left: '0'
      }}
    >
      {children}
    </button>
  )
}

const getStyle = state => ({
  borderBottomLeftRadius: '.5rem',
  padding: '.5rem',
  position: 'absolute',
  zIndex: 1000,
  color: 'white',
  background: 'rgba(74,68,90,0.85)',
  top: 0,
  right: 0,
  transform: `translateY(${state.folded ? '-100%' : '0'})`
})

const human = name => {
  return name.replace(/[a-z][A-Z]/g, str => str[0] + ' ' + str[1].toLowerCase())
}

const FlagList = flag.connect(() => {
  return (
    <div>
      {flag.list().map(name => {
        return (
          <div key={name}>
            {human(name)} : <FlagInput onChange={() => {}} name={name} />
          </div>
        )
      })}
    </div>
  )
})

export default class FlagSwitcher extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      folded: true
    }
  }

  render() {
    return (
      flag('switcher') && (
        <div className="flag-switcher" style={getStyle(this.state)}>
          <FoldButton
            onClick={() =>
              this.setState(prevState => ({
                folded: !prevState.folded
              }))
            }
          >
            {this.state.folded ? 'Show' : 'Hide'} flags
          </FoldButton>
          <button onClick={() => this.setState({ date: Date.now() })}>
            refresh
          </button>
          &nbsp;
          <button
            onClick={() =>
              flag.reset() && flag('switcher', true) && this.forceUpdate()
            }
          >
            reset
          </button>
          <FlagList />
        </div>
      )
    )
  }
}

FlagSwitcher.List = FlagList
