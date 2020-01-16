import maxBy from 'lodash/maxBy'
import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'

export const getRuleValue = rule => rule.value
export const getRuleAccountOrGroupDoctype = rule =>
  rule.accountOrGroup ? rule.accountOrGroup._type : undefined
export const getRuleAccountOrGroupId = rule =>
  rule.accountOrGroup ? rule.accountOrGroup._id : undefined

export const ensureNewRuleFormat = rules =>
  !Array.isArray(rules) ? [{ ...rules, id: 0 }] : rules

export const getRuleId = rule => rule.id

export const getNextRuleId = rules => {
  return rules.length === 0 ? 0 : getRuleId(maxBy(rules, getRuleId)) + 1
}

export const ruleAccountFilter = (rule, groups) => account => {
  const accountOrGroup = rule.accountOrGroup
  if (!accountOrGroup) {
    return true
  } else if (accountOrGroup._type === ACCOUNT_DOCTYPE) {
    return account._id === accountOrGroup._id
  } else if (accountOrGroup._type === GROUP_DOCTYPE) {
    const group = groups.find(group => accountOrGroup._id === group._id)
    if (group && group.accounts) {
      return group.accounts.includes(account._id)
    } else {
      // In case of non existent group, prefer to consider that no accounts
      // belong to it
      return false
    }
  }
}
