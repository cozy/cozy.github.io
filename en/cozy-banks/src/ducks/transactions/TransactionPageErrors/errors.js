import sortBy from 'lodash/sortBy'
import keyBy from 'lodash/keyBy'
import mapValues from 'lodash/mapValues'
import { isBankTrigger } from 'utils/triggers'
import { utils, trigger as triggerLibs } from 'cozy-client/dist/models'

const { triggers: triggerUtils, triggerStates } = triggerLibs

/**
 * Returns errors that should be displayed in the error container
 *
 * @returns
 */
export const getTransactionPageErrors = ({ triggerCol, accounts }) => {
  const konnectorToAccounts = keyBy(accounts, utils.getCreatedByApp)
  const konnectorToInstitutionLabel = mapValues(
    konnectorToAccounts,
    acc => acc && acc.institutionLabel
  )
  const triggers = triggerCol.data

  const erroredTriggers = sortBy(
    triggers
      .filter(triggerUtils.isKonnectorWorker)
      .filter(isBankTrigger)
      .filter(triggerStates.isErrored)
      .filter(triggerUtils.hasActionableError)
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
