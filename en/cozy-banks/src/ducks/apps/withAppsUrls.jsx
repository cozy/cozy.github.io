import React, { Component } from 'react'
import { queryConnect } from 'cozy-client'
import { appsConn } from 'doctypes'
import { getAppUrlById } from 'selectors'
import { connect } from 'react-redux'
import { flowRight as compose } from 'lodash'

const withAppsUrls = Wrapped => {
  class RawWithAppsUrls extends Component {
    render() {
      return <Wrapped {...this.props} urls={this.props.urls} />
    }
  }

  function mapStateToProps(state, ownProps) {
    const enhancedState = {
      ...state,
      apps: ownProps.apps
    }

    return {
      urls: {
        MAIF: getAppUrlById(enhancedState, 'io.cozy.apps/maif'),
        HEALTH: getAppUrlById(enhancedState, 'io.cozy.apps/sante'),
        EDF: getAppUrlById(enhancedState, 'io.cozy.apps/edf'),
        COLLECT: getAppUrlById(enhancedState, 'io.cozy.apps/collect'),
        HOME: getAppUrlById(enhancedState, 'io.cozy.apps/home')
      }
    }
  }

  const WithAppsUrls = compose(
    queryConnect({
      apps: appsConn
    }),
    connect(mapStateToProps)
  )(RawWithAppsUrls)

  return WithAppsUrls
}

export default withAppsUrls
