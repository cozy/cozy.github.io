import { connect } from 'react-redux'

const withDispatch = Component =>
  connect(null, dispatch => ({ dispatch }))(Component)

export { withDispatch }
