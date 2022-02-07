import { GROUP_DOCTYPE } from 'doctypes'
import { makeMessage } from './NoReimbursedExpenses'

const t = x => x

describe('makeMessage', () => {
  it('should return group key', () => {
    const doc = { _type: GROUP_DOCTYPE }
    const categoryName = 'theCategoryName'
    const message = makeMessage({ doc, categoryName, t })

    expect(message).toBe('Reimbursements.noReimbursed.group')
  })

  it('should return categoryName key', () => {
    const doc = { _type: 'other' }
    const categoryName = 'theCategoryName'
    const message = makeMessage({ doc, categoryName, t })

    expect(message).toBe('Reimbursements.noReimbursed.theCategoryName')
  })

  it('should return generic key', () => {
    const doc = { _type: 'other' }
    const categoryName = undefined
    const message = makeMessage({ doc, categoryName, t })

    expect(message).toBe('Reimbursements.noReimbursed.generic')
  })
})
