import React from 'react'
import PropTypes from 'prop-types'
import { MountPointContext } from 'cozy-harvest-lib/dist/components/MountPointContext'

// Extracted from Backbone
const optionalParam = /\((.*?)\)/g
const namedParam = /(\(\?)?:\w+/g
const splatParam = /\*\w+/g

// eslint-disable-next-line no-useless-escape
const escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g

/**
 * Transforms a route containing params (eg: /accounts/:id) into
 * a regex that can be used to match a fragment
 *
 * Extracted from Backbone
 */
export const routeToRegExp = function (route) {
  const newRoute = route
    .replace(escapeRegExp, '\\$&')
    .replace(optionalParam, '(?:$1)?')
    .replace(namedParam, function (match, optional) {
      return optional ? match : '([^/?]+)'
    })
    .replace(splatParam, '([^?]*?)')
  return new RegExp('^' + newRoute + '(?:\\?([\\s\\S]*))?$')
}

/**
 * Given a generic route with params and a fragment, will
 * extract the params from the fragment as an array
 */
export const extractParameters = function (route, fragment) {
  var params = route.exec(fragment).slice(1)
  return params.map(function (param, i) {
    if (i === params.length - 1) return param || null
    return param ? decodeURIComponent(param) : null
  })
}

/**
 * Simili Switch, this component is here to facilitate the usage of Harvest
 * routes inside Banks. It should be removed when we update to react-router@5.
 *
 * Since Banks does not have react-router@5, we cannot use directly the Routes
 * from cozy-harvest-lib. To circumvent this problem, we rely on the fact that
 * Harvest components use a context provided pushHistory to navigate between
 * different parts of Harvest. This pushHistory is provided via the context,
 * which lets us override it with our own function, which stores the current
 * fragment inside the Switch state. The Switch then has its own logic to
 * match the current state fragment which its routes passed via props.
 *
 * It extracts the params from the fragment and passes it to the second
 * parameter of props.routes item, which is a render function which gets
 * passed the params.
 */
class Switch extends React.Component {
  constructor(props, context) {
    super(props, context)

    // Transform routes into regexes
    this.routes = props.routes.map(([route, render]) => {
      return [routeToRegExp(route), render]
    })
    this.state = {
      fragment: props.initialFragment
    }

    this.pushHistory = this.pushHistory.bind(this)
    this.mountPointContext = {
      pushHistory: this.pushHistory,
      replaceHistory: this.pushHistory
    }
  }

  pushHistory(fragment) {
    this.setState({ fragment })
  }

  render() {
    const { fragment } = this.state

    for (let [route, render] of this.routes) {
      if (fragment.match(route)) {
        const params = extractParameters(route, fragment)
        const el = render(...params)
        return (
          <MountPointContext.Provider value={this.mountPointContext}>
            {el}
          </MountPointContext.Provider>
        )
      }
    }
    return <div>No match for {fragment}</div>
  }
}

Switch.propTypes = {
  routes: PropTypes.array.isRequired
}

export default Switch
