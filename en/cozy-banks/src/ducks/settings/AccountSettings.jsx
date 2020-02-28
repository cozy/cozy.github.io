import React from 'react'
import { translate, withBreakpoints } from 'cozy-ui/transpiled/react'
import { withDispatch } from 'utils'
import { flowRight as compose } from 'lodash'
import NewAccountSettings from './NewAccountSettings'

const AccountSettings = function(props) {
  return <NewAccountSettings {...props} />
}

export default compose(
  withDispatch,
  translate(),
  withBreakpoints()
)(AccountSettings)
