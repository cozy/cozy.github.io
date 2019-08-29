import React, { Component } from 'react'
import Types from 'prop-types'
import { translate } from 'cozy-ui/react'

const styles = {
  container: {
    background: 'crimson',
    color: 'white',
    fontFamily: 'monospace',
    fontSize: '1rem',
    padding: '0.5rem',
    margin: '0.5rem',
    borderRadius: 2
  },
  btn: {
    textDecoration: 'underline',
    color: 'white'
  },
  pre: {
    fontSize: '1rem'
  }
}

const ident = c => c
/**
  Display errors in a red background with a button
  to display the stack trace
*/
class DisplayError extends Component {
  render({ error, t = ident }, { displayStack }) {
    const toggleStack = () =>
      this.setState({
        displayStack: !displayStack
      })
    return (
      <div style={styles.container}>
        {error.message}
        <br />
        <a style={styles.btn} onClick={toggleStack}>
          {displayStack
            ? t('Error.less-information')
            : t('Error.more-information')}
        </a>
        {displayStack && <pre style={styles.pre}>{error.stack}</pre>}
      </div>
    )
  }
}

DisplayError.propTypes = {
  /** Error whose stack trace you want to show */
  error: Types.instanceOf(Error).isRequired
}

export default translate()(DisplayError)
