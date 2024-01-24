import React from 'react'
import cx from 'classnames'
import { connect } from 'react-redux'

import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

import Header from 'components/Header'
import Padded from 'components/Padded'
import BackButton from 'components/BackButton'
import { getFilteredAccounts } from 'ducks/filters'
import { BarRight } from 'components/Bar'
import SearchIconLink from 'ducks/search/SearchIconLink'
import LegalMention from 'ducks/legal/LegalMention'
import AccountSwitchBalanceDetails from 'ducks/balance/AccountSwitchBalanceDetails'
import SelectionIconLink from 'ducks/selection/SelectionIconLink'
import { useSelectionContext } from 'ducks/context/SelectionContext'

export const DumbBalanceDetailsHeader = props => {
  const { isMobile } = useBreakpoints()
  const { accountSwitchSize, children, showLegalMention } = props
  const { isSelectionModeActive, setIsSelectionModeActive } =
    useSelectionContext()

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
          <SearchIconLink />
          <SelectionIconLink
            isSelectionModeActive={isSelectionModeActive}
            setIsSelectionModeActive={setIsSelectionModeActive}
          />
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
