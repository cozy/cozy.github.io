import orderBy from 'lodash/orderBy'
import { trigger as triggerLibs } from 'cozy-client/dist/models'

const { triggers: triggerUtils, triggerStates } = triggerLibs

/**
 * Returns errors that should be displayed in the error container
 *
 * @returns
 */
export const getTriggersOrderByError = ({
  triggers,
  accounts,
  isBankTrigger
}) => {
  const accountsConnectionId = accounts
    .map(account => account.relationships?.connection?.data?._id)
    .filter(Boolean)

  const bankTriggers = triggers
    .filter(triggerUtils.isKonnectorWorker)
    .filter(isBankTrigger)
    .filter(trigger => accountsConnectionId.includes(trigger.message.account))

  const bankTriggersOrdered = orderBy(
    bankTriggers,
    triggerStates.isErrored,
    'desc'
  )

  return bankTriggersOrdered
}
