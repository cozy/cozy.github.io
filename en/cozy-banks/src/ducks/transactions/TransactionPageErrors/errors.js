import sortBy from 'lodash/sortBy'
import keyBy from 'lodash/keyBy'
import mapValues from 'lodash/mapValues'
import { utils, trigger as triggerLibs } from 'cozy-client/dist/models'
import flag from 'cozy-flags'

const { triggers: triggerUtils, triggerStates } = triggerLibs

/**
 * Returns errors that should be displayed in the error container
 *
 * @returns
 */
export const getTransactionPageErrors = ({
  triggerCol,
  accounts,
  isBankTrigger
}) => {
  const konnectorToAccounts = keyBy(accounts, utils.getCreatedByApp)
  const konnectorToInstitutionLabel = mapValues(
    konnectorToAccounts,
    acc => acc && acc.institutionLabel
  )
  const triggers = triggerCol.data

  const bankKonnectorTriggers = triggers
    .filter(triggerUtils.isKonnectorWorker)
    .filter(isBankTrigger)
  const erroredTriggers = sortBy(
    bankKonnectorTriggers
      .filter(triggerStates.isErrored)
      .filter(triggerUtils.hasActionableError)
      .filter(tr => konnectorToAccounts[tr.message.konnector]),
    tr => tr.message.konnector
  )

  if (!erroredTriggers.length > 0 && flag('banks.debug.force-trigger-error')) {
    erroredTriggers.push(bankKonnectorTriggers[0])
    erroredTriggers.push(bankKonnectorTriggers[0])
  }

  return erroredTriggers.map(tr => ({
    trigger: tr,
    type: 'errored-trigger',
    bankName: konnectorToInstitutionLabel[tr.message.konnector],
    _id: tr._id
  }))
}
