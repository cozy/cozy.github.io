/* global cozy */

import React from 'react'
import Header from 'components/Header'
import { Padded } from 'components/Spacing'
import { withBreakpoints } from 'cozy-ui/react'
import BackButton from 'components/BackButton'
import { AccountSwitch } from 'ducks/account'
import cx from 'classnames'
import { connect } from 'react-redux'
import { flowRight as compose } from 'lodash'
import { getFilteredAccounts } from 'ducks/filters'
import BarBalance from 'components/BarBalance'

const { BarRight } = cozy.bar

export const DumbBalanceDetailsHeader = props => {
  const {
    breakpoints: { isMobile },
    small,
    showBalance,
    filteredAccounts,
    children
  } = props

  return (
    <Header color="primary" fixed>
      <Padded
        className={cx({
          'u-p-0': isMobile,
          'u-pb-half': !isMobile && children
        })}
      >
        <div className={'u-flex u-flex-items-center'}>
          <BackButton theme="primary" arrow />
          <AccountSwitch small={small} color="primary" />
        </div>
      </Padded>
      {showBalance && isMobile && (
        <BarRight>
          <BarBalance accounts={filteredAccounts} theme={'primary'} />
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

const BalanceDetailsHeader = compose(
  withBreakpoints(),
  connect(mapStateToProps)
)(DumbBalanceDetailsHeader)

export default BalanceDetailsHeader
