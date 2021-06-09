import React from 'react'
import cx from 'classnames'
import { connect } from 'react-redux'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

import Header from 'components/Header'
import Padded from 'components/Padded'
import BackButton from 'components/BackButton'
import { getFilteredAccounts } from 'ducks/filters'
import BarBalance from 'components/BarBalance'
import { BarRight } from 'components/Bar'
import SearchIconLink from 'ducks/search/SearchIconLink'
import LegalMention from 'ducks/legal/LegalMention'
import AccountSwitchBalanceDetails from 'ducks/balance/AccountSwitchBalanceDetails'

export const DumbBalanceDetailsHeader = props => {
  const { isMobile } = useBreakpoints()
  const {
    accountSwitchSize,
    showBalance,
    filteredAccounts,
    children,
    showLegalMention
  } = props

  return (
    <Header theme="inverted" fixed>
      <Padded
        className={cx({
          'u-p-0': isMobile,
          'u-pb-half': !isMobile && children
        })}
      >
        <div className={'u-flex u-flex-items-center'}>
          <BackButton theme="primary" arrow />
          <AccountSwitchBalanceDetails accountSwitchSize={accountSwitchSize} />
        </div>
        {showLegalMention !== false ? (
          <LegalMention className={isMobile ? 'u-mr-1 u-mb-half' : ''} />
        ) : null}
      </Padded>
      {isMobile && (
        <BarRight>
          {showBalance ? <BarBalance accounts={filteredAccounts} /> : null}
          <SearchIconLink />
        </BarRight>
      )}
      {children}
    </Header>
  )
}

const mapStateToProps = state => {
  return {
    filteredAccounts: getFilteredAccounts(state)
  }
}

const BalanceDetailsHeader = connect(mapStateToProps)(DumbBalanceDetailsHeader)

export default BalanceDetailsHeader
