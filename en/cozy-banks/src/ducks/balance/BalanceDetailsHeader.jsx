import React from 'react'
import Header from 'components/Header'
import { Padded } from 'components/Spacing'
import BackButton from 'components/BackButton'
import { AccountSwitch } from 'ducks/account'
import cx from 'classnames'
import { connect } from 'react-redux'
import { getFilteredAccounts } from 'ducks/filters'
import BarBalance from 'components/BarBalance'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import { BarRight } from 'components/Bar'

export const DumbBalanceDetailsHeader = props => {
  const { isMobile } = useBreakpoints()
  const { small, showBalance, filteredAccounts, children } = props

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
          <AccountSwitch small={small} theme="inverted" />
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

const BalanceDetailsHeader = connect(mapStateToProps)(DumbBalanceDetailsHeader)

export default BalanceDetailsHeader
