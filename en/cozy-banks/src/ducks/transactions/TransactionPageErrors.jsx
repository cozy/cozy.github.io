import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import compose from 'lodash/flowRight'
import sortBy from 'lodash/sortBy'
import get from 'lodash/get'
import keyBy from 'lodash/keyBy'
import mapValues from 'lodash/mapValues'
import { getFilteredAccounts } from 'ducks/filters'

import CozyClient, { queryConnect } from 'cozy-client'

import { triggersConn } from 'doctypes'
import { isErrored, isBankTrigger } from 'utils/triggers'
import Carrousel from 'components/Carrousel'
import TriggerErrorCard from 'ducks/transactions/TriggerErrorCard'
import flag from 'cozy-flags'

const getCreatedByApp = acc => get(acc, 'cozyMetadata.createdByApp')

/**
 * Returns
 * - failed triggers corresponding to the given accounts.
 * - a mapping from konnector to institutionLabel (caissedepargne1 -> Caisse d'Epargne)
 *
 * Extracted from TransactionPageErrors because it should be closer to the redux store.
 */
export const getDerivedData = ({ triggerCol, accounts }) => {
  const konnectorToAccounts = keyBy(accounts, getCreatedByApp)
  const konnectorToInstitutionLabel = mapValues(
    konnectorToAccounts,
    acc => acc && acc.institutionLabel
  )
  const triggers = triggerCol.data
  const failedTriggers = sortBy(
    triggers
      .filter(isBankTrigger)
      .filter(isErrored)
      .filter(tr => konnectorToAccounts[tr.message.konnector]),
    tr => tr.message.konnector
  )
  return { failedTriggers, konnectorToInstitutionLabel }
}

/**
 * Shows connection errors for the currently filtered bank accounts.
 * If there is more than 1 error, a carrousel wraps the errors.
 */
const TransactionPageErrors = props => {
  const { failedTriggers, konnectorToInstitutionLabel } = getDerivedData(props)
  const count = failedTriggers.length
  const Wrapper = count > 1 ? Carrousel : React.Fragment
  const wrapperProps =
    count > 1
      ? {
          className: 'u-bg-chablis'
        }
      : null

  if (flag('demo') || !flag('transactions-error-banner')) {
    return null
  }

  return (
    <Wrapper {...wrapperProps}>
      {failedTriggers.map((trigger, i) => (
        <TriggerErrorCard
          className="u-flex-shrink-0"
          bankName={konnectorToInstitutionLabel[trigger.message.konnector]}
          key={trigger._id}
          index={i}
          count={count}
          trigger={trigger}
        />
      ))}
    </Wrapper>
  )
}

TransactionPageErrors.propTypes = {
  triggerCol: PropTypes.object.isRequired,
  accounts: PropTypes.array.isRequired
}

export const DumbTransactionPageErrors = TransactionPageErrors

export default compose(
  connect(state => ({
    accounts: getFilteredAccounts(state)
  })),
  queryConnect({
    triggerCol: {
      ...triggersConn,
      fetchPolicy: CozyClient.fetchPolicies.noFetch
    }
  }),
  React.memo
)(TransactionPageErrors)
