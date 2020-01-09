import React from 'react'
import { translate } from 'cozy-ui/react'
import { queryConnect, hasQueryBeenLoaded } from 'cozy-client'
import { connect } from 'react-redux'
import { accountsConn } from 'doctypes'
import { getAccountLabel, isCreditCardAccount } from 'ducks/account/helpers'
import { Spinner } from 'cozy-ui/react'

import { getAccountsById } from 'selectors'
import compose from 'lodash/flowRight'
import { delayedDebits } from './specs'
import makeRuleComponent from './makeRuleComponent'

const getCreditCardDefaultValue = props => {
  const { accounts } = props.ruleProps
  const selectedAccount = (accounts.data || []).find(isCreditCardAccount)
  return selectedAccount ? selectedAccount : null
}

const getCheckingsDefaultValue = props => {
  const selectedCreditCard = getCreditCardDefaultValue(props)
  return selectedCreditCard && selectedCreditCard.checkingsAccount
    ? selectedCreditCard.checkingsAccount.data
    : null
}

const getRelevantAccounts = props => {
  const { doc } = props
  const { accountsById } = props.ruleProps
  const docCreditCardAccount = doc.creditCardAccount
    ? accountsById[doc.creditCardAccount._id]
    : null
  const docCheckingsAccount = doc.checkingsAccount
    ? accountsById[doc.checkingsAccount._id]
    : null

  const creditCardAccount =
    docCreditCardAccount || getCreditCardDefaultValue(props)
  const checkingsAccount =
    docCheckingsAccount || getCheckingsDefaultValue(props)

  return {
    docCreditCardAccount,
    creditCardAccount,
    docCheckingsAccount,
    checkingsAccount
  }
}

const getDescriptionProps = props => {
  const { docCreditCardAccount, docCheckingsAccount } = getRelevantAccounts(
    props
  )
  const creditCardLabel = docCreditCardAccount
    ? getAccountLabel(docCreditCardAccount)
    : '...'
  const checkingsLabel = docCheckingsAccount
    ? getAccountLabel(docCheckingsAccount)
    : '...'

  return {
    creditCardLabel,
    checkingsLabel,
    value: props.doc.value
  }
}

const shouldOpenOnToggle = props => {
  const { creditCardAccount, checkingsAccount } = getRelevantAccounts(props)
  return !creditCardAccount || !checkingsAccount
}

const newDelayedDebitRule = { enabled: true, value: 3 }
const initialDelayedDebitRules = [{ enabled: false, value: 3 }]

const DelayedDebitRules = makeRuleComponent({
  displayName: 'DelayedDebit',
  getInitialRules: () => initialDelayedDebitRules,
  spec: delayedDebits,
  getNewRule: () => ({ ...newDelayedDebitRule }),
  getRuleDescriptionKey: () => 'Notifications.delayed_debit.description',
  getRuleDescriptionProps: getDescriptionProps,
  shouldOpenOnToggle: shouldOpenOnToggle
})

const WaitForLoadingDelayedDebitRules = props => {
  const { accounts, accountsById } = props
  if (!hasQueryBeenLoaded(accounts)) {
    return <Spinner />
  }
  return (
    <DelayedDebitRules
      rules={props.rules}
      onChangeRules={props.onChangeRules}
      t={props.t}
      ruleProps={{ accounts, accountsById }}
    />
  )
}

const withAccounts = queryConnect({
  accounts: accountsConn
})
const withAccountsById = connect(state => ({
  accountsById: getAccountsById(state)
}))

export default compose(
  translate(),
  withAccounts,
  withAccountsById
)(WaitForLoadingDelayedDebitRules)
