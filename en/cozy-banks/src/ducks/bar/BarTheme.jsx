/* global cozy, __TARGET__ */

import React from 'react'
import PropTypes from 'prop-types'
import withSideEffect from 'react-side-effect'
import { setTheme as setStatusBarTheme } from 'ducks/bar/statusBar'
import barOverrides from 'ducks/bar/overrides'

export const setBarTheme = theme => {
  if (__TARGET__ === 'mobile') {
    setStatusBarTheme(theme)
  }

  if (cozy.bar && cozy.bar.setTheme) {
    const overrides = barOverrides[theme]
    cozy.bar.setTheme(theme, overrides)
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

export default withSideEffect(reducePropsToState, handleStateChangeOnClient)(
  BarTheme
)
