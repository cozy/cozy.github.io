import React, { Component } from 'react'
import { queryConnect } from 'cozy-client'
import { triggersConn } from 'doctypes'
import { getBrands } from 'ducks/brandDictionary'
import { includes } from 'lodash'
import { isCollectionLoading, hasBeenLoaded } from 'ducks/client/utils'
import { isKonnectorTrigger, getKonnectorFromTrigger } from 'utils/triggers'

const getInstalledKonnectorsSlugs = triggerCol => {
  if (isCollectionLoading(triggerCol) && !hasBeenLoaded(triggerCol)) {
    return []
  }

  return triggerCol.data
    .filter(isKonnectorTrigger)
    .map(getKonnectorFromTrigger)
    .filter(Boolean)
}

const getInstalledBrands = triggerCol => {
  const installedKonnectorsSlugs = getInstalledKonnectorsSlugs(triggerCol)
  const brands = getBrands().map(brand => ({
    ...brand,
    hasTrigger: includes(installedKonnectorsSlugs, brand.konnectorSlug)
  }))

  return brands
}

const withBrands = (options = { queryName: 'triggers' }) => Wrapped => {
  class RawWithBrands extends Component {
    render() {
      const brands = getInstalledBrands(this.props.triggers)
      return <Wrapped {...this.props} brands={brands} />
    }
  }

  const WithBrands = queryConnect({
    triggers: { ...triggersConn, as: options.queryName }
  })(RawWithBrands)

  return WithBrands
}

export default withBrands
