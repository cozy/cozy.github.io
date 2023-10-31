import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import compose from 'lodash/flowRight'

import { getFilteredAccounts } from 'ducks/filters'

import CozyClient, { queryConnect } from 'cozy-client'

import TriggerErrorCard from 'ducks/transactions/TriggerErrorCard'
import { konnectorTriggersConn } from 'doctypes'
import Carrousel from 'components/Carrousel'
import flag from 'cozy-flags'
import { getTransactionPageErrors } from 'ducks/transactions/TransactionPageErrors/errors'
import withBankingSlugs from 'hoc/withBankingSlugs'

/**
 * Shows connection errors for the currently filtered bank accounts.
 * If there is more than 1 error, a carrousel wraps the errors.
 */
export const TransactionPageErrors = props => {
  const errors = getTransactionPageErrors(props)
  const count = errors.length
  const Wrapper = count > 1 ? Carrousel : React.Fragment
  const wrapperProps =
    count > 1
      ? {
          className: 'u-bg-errorBackground'
        }
      : null

  if (flag('demo')) {
    return null
  }

  return (
    <Wrapper {...wrapperProps}>
      {errors.map((error, i) => {
        const Component = TransactionPageErrors.errorTypeToComponent[error.type]
        if (!Component) {
          throw new Error(`No component available for error ${error.type}`)
        }
        return (
          <Component
            className="u-flex-shrink-0"
            error={error}
            key={error._id}
            index={i}
            count={count}
          />
        )
      })}
    </Wrapper>
  )
}

// Use static property to be able to override
TransactionPageErrors.errorTypeToComponent = {
  'errored-trigger': TriggerErrorCard
}

TransactionPageErrors.propTypes = {
  triggerCol: PropTypes.object.isRequired,
  accounts: PropTypes.array.isRequired
}

export default compose(
  connect(state => ({
    accounts: getFilteredAccounts(state)
  })),
  queryConnect({
    triggerCol: {
      ...konnectorTriggersConn,
      fetchPolicy: CozyClient.fetchPolicies.noFetch
    }
  }),
  React.memo,
  withBankingSlugs
)(TransactionPageErrors)
