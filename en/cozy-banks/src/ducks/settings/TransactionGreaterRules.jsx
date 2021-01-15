import makeRuleComponent from './makeRuleComponent'
import { transactionGreater } from './specs'

const getTransactionGreaterDescriptionKey = props => {
  if (props.doc && props.doc.accountOrGroup) {
    return 'Notifications.if-transaction-greater.descriptionWithAccountGroup'
  } else {
    return 'Notifications.if-transaction-greater.description'
  }
}

const getTransactionGreaterDescriptionProps = props => ({
  accountOrGroupLabel: props.doc.accountOrGroup
    ? props.getAccountOrGroupLabel(props.doc.accountOrGroup)
    : null,
  value: props.doc.value
})

const initialTransactionGreaterRules = [
  { id: 0, value: 100, accountOrGroup: null, enabled: false }
]

const newTransactionGreaterRule = {
  enabled: true,
  value: 100,
  accountOrGroup: null
}

export default makeRuleComponent({
  displayName: 'TransactionGreater',
  getInitialRules: () => initialTransactionGreaterRules,
  spec: transactionGreater,
  getNewRule: () => ({ ...newTransactionGreaterRule }),
  getRuleDescriptionKey: getTransactionGreaterDescriptionKey,
  getRuleDescriptionProps: getTransactionGreaterDescriptionProps,
  trackPageName: 'parametres:configuration:alerte-mouvements'
})
