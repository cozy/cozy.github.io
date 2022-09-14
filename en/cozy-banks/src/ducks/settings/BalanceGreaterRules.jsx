import makeRuleComponent from './makeRuleComponent'
import { balanceGreater } from './specs'

const getBalanceGreaterDescriptionKey = props => {
  if (props.doc && props.doc.accountOrGroup) {
    return 'Notifications.if-balance-greater.descriptionWithAccountGroup'
  } else {
    return 'Notifications.if-balance-greater.description'
  }
}

const getBalanceGreaterDescriptionProps = props => {
  return {
    accountOrGroupLabel: props.doc.accountOrGroup
      ? props.getAccountOrGroupLabel(props.doc.accountOrGroup)
      : null,
    value: props.doc.value
  }
}

const initialBalanceGreaterRules = [
  { id: 0, value: 1000, accountOrGroup: null, enabled: false }
]

const newBalanceGreaterRule = {
  enabled: true,
  value: 1000,
  accountOrGroup: null
}

export default makeRuleComponent({
  displayName: 'BalanceGreater',
  getInitialRules: () => initialBalanceGreaterRules,
  spec: balanceGreater,
  getNewRule: () => ({ ...newBalanceGreaterRule }),
  getRuleDescriptionKey: getBalanceGreaterDescriptionKey,
  getRuleDescriptionProps: getBalanceGreaterDescriptionProps,
  trackPageName: 'parametres:configuration:alerte-solde_haut'
})
