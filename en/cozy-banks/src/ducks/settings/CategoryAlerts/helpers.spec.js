import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'
import {
  getAccountOrGroupChoiceFromAlert,
  getCategoryChoiceFromAlert,
  getMaxThresholdChoiceFromAlert,
  updatedAlertFromAccountOrGroupChoice,
  updatedAlertFromCategoryChoice,
  updatedAlertFromMaxThresholdChoice
} from './helpers'

describe('alert helpers', () => {
  const alert = {
    accountOrGroup: {
      _id: 'account-id',
      _type: ACCOUNT_DOCTYPE
    },
    maxThreshold: 20,
    categoryId: '400600',
    categoryIsParent: true
  }

  it('should get account or group choice from alert', () => {
    expect(getAccountOrGroupChoiceFromAlert(alert)).toEqual({
      _id: 'account-id',
      _type: ACCOUNT_DOCTYPE
    })
  })

  it('should get category choice from alert', () => {
    expect(getCategoryChoiceFromAlert(alert)).toEqual({
      id: '400600',
      isParent: true
    })
  })

  it('should get max threshold from alert', () => {
    expect(getMaxThresholdChoiceFromAlert(alert)).toEqual(20)
  })

  it('should update alert from account or group choice', () => {
    expect(
      updatedAlertFromAccountOrGroupChoice(alert, {
        _id: 'group-id-2',
        _type: GROUP_DOCTYPE
      })
    ).toEqual({
      ...alert,
      accountOrGroup: {
        _id: 'group-id-2',
        _type: GROUP_DOCTYPE
      }
    })
  })

  it('should update alert from category choice', () => {
    expect(
      updatedAlertFromCategoryChoice(alert, {
        id: '400620',
        isParent: false
      })
    ).toEqual({
      ...alert,
      categoryId: '400620',
      categoryIsParent: false
    })
  })

  it('should update alert from max threshold choice', () => {
    expect(updatedAlertFromMaxThresholdChoice(alert, 40)).toEqual({
      ...alert,
      maxThreshold: 40
    })
  })
})
