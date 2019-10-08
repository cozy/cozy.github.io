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

  function mapStateToProps(state) {
    return {
      urls: {
        MAIF: getAppUrlById(state, 'io.cozy.apps/maif'),
        HEALTH: getAppUrlById(state, 'io.cozy.apps/sante'),
        EDF: getAppUrlById(state, 'io.cozy.apps/edf'),
        COLLECT: getAppUrlById(state, 'io.cozy.apps/collect'),
        HOME: getAppUrlById(state, 'io.cozy.apps/home')
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
