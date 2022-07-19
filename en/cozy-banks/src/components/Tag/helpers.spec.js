import { makeTagsToRemove, makeTagsToAdd } from './helpers'

describe('makeTagsToAdd', () => {
  it('should return tags to add', () => {
    const transactionTags = [{ _id: 'id01', label: 'label01' }]
    const selectedTagIds = ['id01', 'id02', 'id03']
    const allTags = [
      { _id: 'id01', label: 'label01', transactions: [] },
      { _id: 'id02', label: 'label02', transactions: [] },
      { _id: 'id03', label: 'label03', transactions: [] }
    ]

    const res = makeTagsToAdd({ transactionTags, selectedTagIds, allTags })

    expect(res).toStrictEqual([
      { _id: 'id02', label: 'label02', transactions: [] },
      { _id: 'id03', label: 'label03', transactions: [] }
    ])
  })
})

describe('makeTagsToRemove', () => {
  it('should return tags to remove', () => {
    const transactionTags = [
      { _id: 'id01', label: 'label01' },
      { _id: 'id02', label: 'label02' },
      { _id: 'id03', label: 'label03' }
    ]
    const selectedTagIds = ['id01']
    const allTags = [
      { _id: 'id01', label: 'label01', transactions: [] },
      { _id: 'id02', label: 'label02', transactions: [] },
      { _id: 'id03', label: 'label03', transactions: [] }
    ]

    const res = makeTagsToRemove({ transactionTags, selectedTagIds, allTags })

    expect(res).toStrictEqual([
      { _id: 'id02', label: 'label02', transactions: [] },
      { _id: 'id03', label: 'label03', transactions: [] }
    ])
  })
})
