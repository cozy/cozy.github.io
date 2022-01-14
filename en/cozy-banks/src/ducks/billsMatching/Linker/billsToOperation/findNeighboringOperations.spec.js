jest.mock('cozy-konnector-libs')

import {
  findByMangoQuerySimple,
  findNeighboringOperations
} from './findNeighboringOperations'

import { cozyClient } from 'cozy-konnector-libs'

beforeEach(function () {
  const INDEX = 'index'
  cozyClient.data.defineIndex.mockReturnValue(Promise.resolve(INDEX))
})

const asyncResolve = value => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(value)
    }, 1)
  })
}

describe('findByMangoQuerySimple', () => {
  it('should work', () => {
    const operations = [
      { amount: 5 },
      { amount: 6 },
      { amount: 7 },
      { amount: 8 },
      { amount: 9 },
      { amount: 10 }
    ]

    const greaterThanSeven = findByMangoQuerySimple(operations, {
      selector: {
        amount: {
          $gt: 7
        }
      }
    })
    expect(greaterThanSeven.length).toBe(3)

    const equalToEight = findByMangoQuerySimple(operations, {
      selector: {
        amount: {
          $gt: 7,
          $lt: 9
        }
      }
    })
    expect(equalToEight.length).toBe(1)
  })
})

xdescribe('findNeighboringOperations', () => {
  test('when query return length equal to stack limit, fetchAll loop', () => {
    const ops1 = new Array(100)
    const ops2 = new Array(100)
    const ops3 = new Array(21)
    cozyClient.data.query.mockReturnValueOnce(asyncResolve(ops1))
    cozyClient.data.query.mockReturnValueOnce(asyncResolve(ops2))
    cozyClient.data.query.mockReturnValueOnce(asyncResolve(ops3))
    const bill = {}
    const options = {}
    // eslint-disable-next-line
    return findNeighboringOperations(bill, options).then(operations => {
      expect(operations.length).toBe(ops1.length + ops2.length + ops3.length)
    })
  })
})
