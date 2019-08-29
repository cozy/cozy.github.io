import { rangedSome } from './utils'

describe('ranged some', () => {
  const numbers = [1, 1, 3, 5, 4, 6, 2, 8]
  it('should execute a predicate on an array bounded by start/end', () => {
    const isPair = x => x % 2 === 0
    const superiorToThree = x => x > 3
    expect(rangedSome(numbers, isPair, 0, numbers.length)).toBe(true)
    expect(rangedSome(numbers, isPair, 0, 4)).toBe(false)
    expect(rangedSome(numbers, isPair, 4, numbers.length + 5)).toBe(true)
    expect(rangedSome(numbers, isPair, numbers.length + 5, 4)).toBe(true)
    expect(rangedSome(numbers, superiorToThree, -5, 3)).toBe(false)
    expect(rangedSome(numbers, isPair, 4, 4)).toBe(false)
    expect(rangedSome(numbers, superiorToThree, 4, 4)).toBe(false)
  })
})
