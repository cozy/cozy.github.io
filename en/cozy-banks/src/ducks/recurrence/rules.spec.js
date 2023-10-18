import {
  mergeBundles,
  mergeCategoryIds,
  sameLabel,
  brandSplit,
  addStats,
  median
} from './rules'
import keyBy from 'lodash/keyBy'
import fixtures4 from './fixtures/fixtures4.json'
import { TRANSACTION_DOCTYPE } from '../../doctypes'
import brands from 'ducks/brandDictionary/brands'
import getClient from 'selectors/getClient'

jest.mock('selectors/getClient', () => jest.fn())

const ops1 = [
  { _id: 't1', date: '2020-08-01', manualCategoryId: '400140' },
  { _id: 't2', date: '2020-07-01', manualCategoryId: '400140' },
  { _id: 't3', date: '2020-06-01', manualCategoryId: '400140' },
  { _id: 't4', date: '2020-05-01', manualCategoryId: '400140' }
]

const ops2 = [
  { _id: 't5', date: '2020-12-01', manualCategoryId: '400130' },
  { _id: 't6', date: '2020-11-01', manualCategoryId: '400130' },
  { _id: 't7', date: '2020-10-01', manualCategoryId: '400130' },
  { _id: 't8', date: '2020-09-01', manualCategoryId: '400130' }
]

describe('merge hydrated bundles', () => {
  getClient.mockReturnValue({
    store: {
      getState: () => ({ brands })
    }
  })
  it('should not duplicate ops', () => {
    const bundles = [
      {
        ops: ops1,
        categoryIds: ['400140']
      },

      {
        ops: [...ops2, ...[ops1[0], ops2[0]]],
        categoryIds: ['400130', '400120']
      }
    ]
    const merged = mergeBundles(bundles)
    expect(merged.ops.length).toBe(ops1.length + ops2.length)
  })

  it('should merge categoryIds and put the most recent one in front', () => {
    const bundles = [
      {
        ops: ops1,
        categoryIds: ['400140']
      },

      {
        ops: ops2,
        categoryIds: ['400130', '400120']
      }
    ]
    const merged = mergeBundles(bundles)
    expect(merged.categoryIds).toEqual(['400130', '400140', '400120'])
  })
})

describe('mergeCategoryIds', () => {
  const makeOps = ops => ({ ops })

  it('should return empty array when no ops in src or obj', () => {
    expect(mergeCategoryIds(makeOps([]), makeOps([]))).toEqual([])
    expect(
      mergeCategoryIds(
        makeOps([]),
        makeOps([{ date: '2020-12-02T12:00:00.000Z' }])
      )
    ).toEqual([])
    expect(
      mergeCategoryIds(
        makeOps([{ date: '2020-12-02T12:00:00.000Z' }]),
        makeOps([])
      )
    ).toEqual([])
  })
})

describe('sameLabel bundle', () => {
  const makeBundle = (ops, manualLabel) => ({
    ops,
    manualLabel,
    automaticLabel: 'automatic label'
  })

  it('should return label from ops bundle', () => {
    expect(sameLabel(makeBundle([{ label: 'Operation label' }]))).toEqual(
      'Operation label'
    )
  })

  it('should return label from manual and automatic label', () => {
    expect(sameLabel(makeBundle([], undefined))).toEqual('Automatic Label')
    expect(sameLabel(makeBundle([], 'Manual label'))).toEqual('Manual label')
  })
})

describe('brand split', () => {
  it('should split bundle into several bundles based on brand', () => {
    const bundle = {
      ops: [
        {
          label: 'Unibet 1',
          amount: 15,
          categoryIds: ['400100']
        },
        {
          label: 'Amazon 1',
          amount: 15,
          categoryIds: ['400100']
        },
        {
          label: 'Amazon 2',
          amount: 15,
          categoryIds: ['400100']
        },
        {
          label: 'Unibet 2',
          amount: 15,
          categoryIds: ['400100']
        },
        {
          label: 'Unibet 3',
          amount: 15,
          categoryIds: ['400100']
        }
      ]
    }
    const bundles = brandSplit()(bundle)
    expect(bundles.length).toBe(2)
    expect(bundles[0].ops.length).toBe(3)
    expect(bundles[0].brand).toBe('Unibet')
    expect(bundles[1].ops.length).toBe(2)
    expect(bundles[1].brand).toBe('Amazon')
  })
})

describe('make stats', () => {
  const transactionsByKey = keyBy(fixtures4[TRANSACTION_DOCTYPE], '_id')
  const transactions = [
    transactionsByKey['february'],
    transactionsByKey['march'],
    transactionsByKey['april']
  ]

  const makeBundle = ops => ({
    categoryIds: ['200110'],
    amounts: [2000, 2150],
    ops,
    automaticLabel: 'Mon Salaire'
  })

  it('should match values with 3 operations', () => {
    const bundleWithStats = addStats(makeBundle(transactions))
    const { sigma, mean, median, mad } = bundleWithStats.stats.deltas

    expect(sigma).toBe(1.5)
    expect(mean).toBe(29.5)
    expect(median).toBe(29.5)
    expect(mad).toBe(1.5)
  })

  it('should match values with only one operation', () => {
    const bundleWithStats = addStats(
      makeBundle([transactionsByKey['february']])
    )
    const { sigma, mean, median, mad } = bundleWithStats.stats.deltas

    expect(sigma).toBe(NaN)
    expect(mean).toBe(NaN)
    expect(median).toBe(30)
    expect(mad).toBe(NaN)
  })
})

describe('median', () => {
  it('should return the correct median', () => {
    // for an even number of elements
    expect(median([64, 120, 27, 1])).toBe(45.5)
    expect(median([1, 36, 8, 200, 72, 43])).toBe(39.5)
    expect(median([12, 10, 8, 6])).toBe(9)
    expect(median([900, 0])).toBe(450)
    // for an odd number of elements
    expect(median([100, 1, 10])).toBe(10)
    expect(median([2, 22, 222])).toBe(22)
    expect(median([0, 1, 1, 120, 2, 22, 27, 312, 3])).toBe(3)
  })
})
