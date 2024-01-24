import React from 'react'
import PropTypes from 'prop-types'
import withSideEffect from 'react-side-effect'
import barOverrides from 'ducks/bar/overrides'
import cozyBar from 'utils/cozyBar'

export const setBarTheme = theme => {
  if (cozyBar && cozyBar.setTheme) {
    const overrides = barOverrides[theme]
    cozyBar.setTheme(theme, overrides)
  }
}

class BarTheme extends React.Component {
  render() {
    return null
  }
}

BarTheme.propTypes = {
  theme: PropTypes.string.isRequired
}

BarTheme.setBarTheme = setBarTheme

export const DumbBarTheme = BarTheme

function reducePropsToState(propsList) {
  const last = propsList[propsList.length - 1]
  return last ? last.theme : 'default'
}

function handleStateChangeOnClient(theme) {
  BarTheme.setBarTheme(theme)
}

export default withSideEffect(
  reducePropsToState,
  handleStateChangeOnClient
)(BarTheme)
