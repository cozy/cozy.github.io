import React from 'react'
import { connect } from 'react-redux'
import { getAccountType } from 'ducks/account/helpers'
import { TransactionsPageWithBackButton } from 'ducks/transactions'
import { LoanDetailsPage, LoanListPage } from 'ducks/loan'
import { isLoanGroup, isReimbursementsVirtualGroup } from 'ducks/groups/helpers'
import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'
import { ReimbursementsPage } from 'ducks/reimbursements'
import BarTheme from 'ducks/bar/BarTheme'
import { getFilteringDoc } from 'ducks/filters'
import { Outlet } from 'react-router-dom'

const getComponent = filteringDoc => {
  if (filteringDoc && filteringDoc._type === ACCOUNT_DOCTYPE) {
    const accountType = getAccountType(filteringDoc)

    if (accountType === 'Loan') {
      return LoanDetailsPage
    } else if (accountType === 'Reimbursements') {
      return ReimbursementsPage
    } else {
      return TransactionsPageWithBackButton
    }
  } else if (filteringDoc && filteringDoc._type === GROUP_DOCTYPE) {
    if (isLoanGroup(filteringDoc)) {
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
      <Outlet />
    </>
  )
}

function mapStateToProps(state) {
  return {
    filteringDoc: getFilteringDoc(state)
  }
}

const BalanceDetailsPage = connect(mapStateToProps)(RawBalanceDetailsPage)

export default BalanceDetailsPage
