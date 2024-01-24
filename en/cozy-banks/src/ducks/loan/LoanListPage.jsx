import React from 'react'
import { queryConnect, isQueryLoading, hasQueryBeenLoaded } from 'cozy-client'
import { Section } from 'components/Section'
import LoanProgress from 'ducks/loan/LoanProgress'
import CompositeRow from 'cozy-ui/transpiled/react/deprecated/CompositeRow'
import Icon from 'cozy-ui/transpiled/react/Icon'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import NarrowContent from 'cozy-ui/transpiled/react/deprecated/NarrowContent'
import AccountIcon from 'components/AccountIcon'
import withFilters from 'components/withFilters'
import { BalanceDetailsHeader } from 'ducks/balance'
import Padded from 'components/Padded'
import compose from 'lodash/flowRight'
import { accountsConn } from 'doctypes'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

import RightIcon from 'cozy-ui/transpiled/react/Icons/Right'

import Typography from 'cozy-ui/transpiled/react/Typography'

const PaddedOnDesktop = props => {
  const { isDesktop } = useBreakpoints()
  const { children } = props

  if (isDesktop) {
    return <Padded>{children}</Padded>
  }

  return children
}

const DumbLoanListPage = props => {
  const { filteringDoc, filterByDoc, accounts: accountsCol } = props

  if (isQueryLoading(accountsCol) && !hasQueryBeenLoaded(accountsCol)) {
    return (
      <>
        <BalanceDetailsHeader showBalance />
        <Padded className="u-flex u-flex-justify-center">
          <Spinner size="xxlarge" />
        </Padded>
      </>
    )
  }

  const accounts = filteringDoc.accounts.data

  return (
    <>
      <BalanceDetailsHeader showBalance />
      {accounts.map(account => (
        <Section key={account._id}>
          <NarrowContent>
            <PaddedOnDesktop>
              <CompositeRow
                primaryText={
                  <div className="u-flex u-flex-items-center">
                    <AccountIcon account={account} />
                    <Typography className="u-ml-1" variant="h6">
                      {account.label}
                    </Typography>
                  </div>
                }
                right={<Icon icon={RightIcon} color="var(--coolGrey)" />}
                actions={<LoanProgress account={account} />}
                className="u-c-pointer"
                onClick={() => {
                  filterByDoc(account)
                }}
              />
            </PaddedOnDesktop>
          </NarrowContent>
        </Section>
      ))}
    </>
  )
}

const LoanListPage = compose(
  withFilters,
  queryConnect({
    accounts: accountsConn
  })
)(DumbLoanListPage)

export default LoanListPage
