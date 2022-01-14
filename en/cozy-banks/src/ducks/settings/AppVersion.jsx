import React from 'react'
import PropTypes from 'prop-types'
import styles from 'ducks/settings/AppVersion.styl'
import flag from 'cozy-flags'
import Alerter from 'cozy-ui/transpiled/react/Alerter'

const takeLast = (arr, n) => {
  const l = arr.length
  const start = Math.max(0, l - n)
  const end = l
  return arr.slice(start, end)
}

const pairs = function* (arr) {
  for (let i = 1; i < arr.length; i++) {
    yield [arr[i - 1], arr[i]]
  }
}

class AppVersion extends React.PureComponent {
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
    this.clicks = []
  }

  handleClick() {
    this.clicks.push({ date: Date.now() })
    this.clicks = takeLast(this.clicks, 3)
    if (this.clicks.length < 3) {
      return
    }
    for (const [prevClick, click] of pairs(this.clicks)) {
      const delta = click.date - prevClick.date
      if (delta > 1000) {
        // Clicks are not close enough
        return
      }
    }
    Alerter.info('Debug flag activated')
    flag('debug', true)
  }

  render() {
    return (
      <div onClick={this.handleClick} className={styles['app-version']}>
        Version {this.props.version}
      </div>
    )
  }
}

AppVersion.propTypes = {
  version: PropTypes.string.isRequired
}

export default AppVersion
