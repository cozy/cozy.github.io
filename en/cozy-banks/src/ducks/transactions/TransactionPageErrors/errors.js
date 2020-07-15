import sortBy from 'lodash/sortBy'
import get from 'lodash/get'
import keyBy from 'lodash/keyBy'
import mapValues from 'lodash/mapValues'
import { isErrored, isBankTrigger } from 'utils/triggers'

const getCreatedByApp = acc => get(acc, 'cozyMetadata.createdByApp')

const isActionableError = trigger => {
  const actionableErrors = [
    'CHALLENGE_ASKED',
    'DISK_QUOTA_EXCEEDED',
    'TERMS_VERSION_MISMATCH',
    'USER_ACTION_NEEDED',
    'USER_ACTION_NEEDED.CHANGE_PASSWORD',
    'USER_ACTION_NEEDED.ACCOUNT_REMOVED',
    'USER_ACTION_NEEDED.WEBAUTH_REQUIRED',
    'USER_ACTION_NEEDED.SCA_REQUIRED',
    'LOGIN_FAILED'
  ]

  return actionableErrors.includes(trigger.current_state.last_error)
}

/**
 * Returns errors that should be displayed in the error container
 *
 * @returns
 */
export const getTransactionPageErrors = ({ triggerCol, accounts }) => {
  const konnectorToAccounts = keyBy(accounts, getCreatedByApp)
  const konnectorToInstitutionLabel = mapValues(
    konnectorToAccounts,
    acc => acc && acc.institutionLabel
  )
  const triggers = triggerCol.data

  const erroredTriggers = sortBy(
    triggers
      .filter(isBankTrigger)
      .filter(isErrored)
      .filter(isActionableError)
      .filter(tr => konnectorToAccounts[tr.message.konnector]),
    tr => tr.message.konnector
  )

  return erroredTriggers.map(tr => ({
    trigger: tr,
    type: 'errored-trigger',
    bankName: konnectorToInstitutionLabel[tr.message.konnector],
    _id: tr._id
  }))
}
