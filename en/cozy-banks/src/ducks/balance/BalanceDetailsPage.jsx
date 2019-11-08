import React from 'react'
import { connect } from 'react-redux'
import { getAccountType } from 'ducks/account/helpers'
import { TransactionsPageWithBackButton } from 'ducks/transactions'
import { LoanDetailsPage, LoanListPage } from 'ducks/loan'
import { isLoanGroup, isReimbursementsVirtualGroup } from 'ducks/groups/helpers'
import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'
import { ReimbursementsPage } from 'ducks/reimbursements'
import flag from 'cozy-flags'
import BarTheme from 'ducks/bar/BarTheme'

const getComponent = filteringDoc => {
  if (filteringDoc._type === ACCOUNT_DOCTYPE) {
    const accountType = getAccountType(filteringDoc)

    if (accountType === 'Loan' && flag('loan-details-page')) {
      return LoanDetailsPage
    } else if (accountType === 'Reimbursements') {
      return ReimbursementsPage
    } else {
      return TransactionsPageWithBackButton
    }
  } else if (filteringDoc._type === GROUP_DOCTYPE) {
    if (isLoanGroup(filteringDoc) && flag('loan-details-page')) {
      return LoanListPage
    } else if (isReimbursementsVirtualGroup(filteringDoc)) {
      return ReimbursementsPage
    } else {
      return TransactionsPageWithBackButton
    }
  } else {
    return TransactionsPageWithBackButton
  }
}

export const RawBalanceDetailsPage = props => {
  const Component = getComponent(props.filteringDoc)
  return (
    <>
      <BarTheme theme={'primary'} />
      <Component {...props} />
    </>
  )
}

function mapStateToProps(state) {
  return {
    filteringDoc: state.filters.filteringDoc
  }
}

const BalanceDetailsPage = connect(mapStateToProps)(RawBalanceDetailsPage)

export default BalanceDetailsPage
