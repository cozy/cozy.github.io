import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'

import Spinner from 'cozy-ui/transpiled/react/Spinner'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import { useQuery, hasQueryBeenLoaded } from 'cozy-client'

import { accountsConn } from 'doctypes'
import { getAccountLabel, isCreditCardAccount } from 'ducks/account/helpers'

import { getAccountsById } from 'selectors'
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
  const { docCreditCardAccount, docCheckingsAccount } =
    getRelevantAccounts(props)
  const creditCardLabel = docCreditCardAccount
    ? getAccountLabel(docCreditCardAccount, props.t)
    : '...'
  const checkingsLabel = docCheckingsAccount
    ? getAccountLabel(docCheckingsAccount, props.t)
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
  getRuleDescriptionKey: () => 'Notifications.delayed-debit.description',
  getRuleDescriptionProps: getDescriptionProps,
  shouldOpenOnToggle: shouldOpenOnToggle,
  trackPageName: 'parametres:configuration:alerte-paiement_differe'
})

const WaitForLoadingDelayedDebitRules = props => {
  const accounts = useQuery(accountsConn.query, accountsConn)
  const accountsById = useSelector(getAccountsById)
  const { t } = useI18n()
  const ruleProps = useMemo(
    () => ({ accounts, accountsById }),
    [accounts, accountsById]
  )

  if (!hasQueryBeenLoaded(accounts)) {
    return <Spinner />
  }
  return (
    <DelayedDebitRules
      rules={props.rules}
      onChangeRules={props.onChangeRules}
      t={t}
      ruleProps={ruleProps}
    />
  )
}

export default WaitForLoadingDelayedDebitRules
