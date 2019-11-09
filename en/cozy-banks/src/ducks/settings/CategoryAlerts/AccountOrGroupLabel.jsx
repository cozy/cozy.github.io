import { getGroupsById, getAccountsById } from 'selectors'
import { connect } from 'react-redux'
import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'

/**
 * From a partial doc { _id, _type }, finds the account/group from the redux store
 * and displays its label
 */
const AccountOrGroupLabel = ({ groupsById, accountsById, doc }) => {
  let docInfo
  if (doc._type == ACCOUNT_DOCTYPE) {
    docInfo = accountsById[doc._id]
  } else if (doc._type == GROUP_DOCTYPE) {
    docInfo = groupsById[doc._id]
  }
  return docInfo ? docInfo.label : null
}

export default connect(state => ({
  groupsById: getGroupsById(state),
  accountsById: getAccountsById(state)
}))(AccountOrGroupLabel)
