import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import { getGroupsById, getAccountsById } from 'selectors'
import { connect } from 'react-redux'
import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'
import { getGroupLabel } from 'ducks/groups/helpers'
import { getAccountLabel } from 'ducks/account/helpers.js'

/**
 * From a partial doc { _id, _type }, finds the account/group from the redux store
 * and displays its label
 */
const AccountOrGroupLabel = ({ groupsById, accountsById, doc }) => {
  const { t } = useI18n()
  if (doc._type == ACCOUNT_DOCTYPE) {
    return getAccountLabel(accountsById[doc._id], t)
  } else if (doc._type == GROUP_DOCTYPE) {
    return getGroupLabel(groupsById[doc._id], t)
  }
  return ''
}

export default connect(state => ({
  groupsById: getGroupsById(state),
  accountsById: getAccountsById(state)
}))(AccountOrGroupLabel)
