import { connect, useStore } from 'react-redux'

import { getInstalledBrandsFromQuery } from './selectors'

const mapStateToProps = queryName => state => ({
  brands: getInstalledBrandsFromQuery(queryName)(state)
})

const withBrands = (options = { queryName: 'triggers' }) =>
  connect(mapStateToProps(options.queryName))

export const useBrands = (options = { queryName: 'triggers' }) => {
  const state = useStore()

  return mapStateToProps(options.queryName)(state)
}

export default withBrands
