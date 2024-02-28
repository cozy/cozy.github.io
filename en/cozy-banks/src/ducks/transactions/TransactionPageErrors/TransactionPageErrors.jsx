import cx from 'classnames'
import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import compose from 'lodash/flowRight'

import { hasQueryBeenLoaded, useQuery } from 'cozy-client'

import { getFilteredAccounts } from 'ducks/filters'
import Carrousel from 'components/Carrousel'
import HarvestBanner from 'ducks/transactions/TransactionPageErrors/HarvestBanner'
import { useBanksContext } from 'ducks/context/BanksContext'
import { getTriggersOrderByError } from 'ducks/transactions/TransactionPageErrors/helpers'
import { konnectorTriggersConn } from 'doctypes'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import Divider from 'cozy-ui/transpiled/react/Divider'

/**
 * Shows connection errors for the currently filtered bank accounts.
 * If there is more than 1 error, a carrousel wraps the errors.
 */
export const TransactionPageErrors = ({ accounts }) => {
  const { isBankTrigger } = useBanksContext()
  const { isMobile, isDesktop } = useBreakpoints()

  const { query: triggersQueryDefinition, ...triggersQueryOptions } =
    konnectorTriggersConn
  const { data: triggers, ...triggersResult } = useQuery(
    triggersQueryDefinition,
    triggersQueryOptions
  )

  if (hasQueryBeenLoaded(triggersResult)) {
    const bankTriggers = getTriggersOrderByError({
      triggers,
      accounts,
      isBankTrigger
    })

    const hasMultipleTriggers = bankTriggers.length > 1
    const Wrapper = hasMultipleTriggers ? Carrousel : 'div'
    const wrapperProps = {
      className: cx(
        'u-mt-1',
        bankTriggers.length === 1 ? 'u-mb-1' : null,
        !isMobile ? 'u-mh-1' : null
      )
    }

    if (bankTriggers.length !== 0) {
      return (
        <>
          <Wrapper {...wrapperProps}>
            {bankTriggers.map(trigger => (
              <HarvestBanner key={trigger._id} trigger={trigger} />
            ))}
          </Wrapper>
          {isDesktop ? <Divider /> : null}
        </>
      )
    }
  }
  return null
}

TransactionPageErrors.propTypes = {
  accounts: PropTypes.array.isRequired
}

export default compose(
  connect(state => ({
    accounts: getFilteredAccounts(state)
  })),
  React.memo
)(TransactionPageErrors)
