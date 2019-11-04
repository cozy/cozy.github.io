import { connect } from 'react-redux'

import { getInstalledBrandsFromQuery } from './selectors'

const withBrands = (options = { queryName: 'triggers' }) =>
  connect(state => ({
    brands: getInstalledBrandsFromQuery(options.queryName)(state)
  }))

export default withBrands
