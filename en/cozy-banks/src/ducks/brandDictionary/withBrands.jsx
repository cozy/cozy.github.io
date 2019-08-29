import React, { Component } from 'react'
import { queryConnect } from 'cozy-client'
import { triggersConn } from 'doctypes'
import { getBrands } from 'ducks/brandDictionary'
import { includes } from 'lodash'
import { isCollectionLoading } from 'ducks/client/utils'
import { getKonnectorFromTrigger } from 'utils/triggers'

const withBrands = (options = { queryName: 'triggers' }) => Wrapped => {
  class RawWithBrands extends Component {
    getInstalledKonnectorsSlugs() {
      const { triggers } = this.props

      if (isCollectionLoading(triggers)) {
        return []
      }

      return triggers.data
        .filter(trigger => trigger.worker === 'konnector')
        .map(getKonnectorFromTrigger)
        .filter(Boolean)
    }

    getBrands() {
      const installedKonnectorsSlugs = this.getInstalledKonnectorsSlugs()
      const brands = getBrands().map(brand => ({
        ...brand,
        hasTrigger: includes(installedKonnectorsSlugs, brand.konnectorSlug)
      }))

      return brands
    }

    render() {
      return <Wrapped {...this.props} brands={this.getBrands()} />
    }
  }

  const WithBrands = queryConnect({
    triggers: { ...triggersConn, as: options.queryName }
  })(RawWithBrands)

  return WithBrands
}

export default withBrands
