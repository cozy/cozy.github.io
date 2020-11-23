import React, { Component } from 'react'
import { queryConnect } from 'cozy-client'
import { connect } from 'react-redux'
import compose from 'lodash/flowRight'

import { appsConn } from 'doctypes'
import { getAppsById, getAppURL } from 'ducks/apps/selectors'

function mapStateToProps(state) {
  const apps = getAppsById(state)
  return {
    urls: {
      MAIF: getAppURL(apps['io.cozy.apps/maif']),
      HEALTH: getAppURL(apps['io.cozy.apps/sante']),
      EDF: getAppURL(apps['io.cozy.apps/edf']),
      COLLECT: getAppURL(apps['io.cozy.apps/collect']),
      HOME: getAppURL(apps['io.cozy.apps/home'])
    }
  }
}

const withAppsUrls = Wrapped => {
  class RawWithAppsUrls extends Component {
    render() {
      return <Wrapped {...this.props} urls={this.props.urls} />
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
