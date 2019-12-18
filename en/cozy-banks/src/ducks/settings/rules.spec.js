import { getNextRuleId } from './ruleUtils'
describe('get next alert id ', () => {
  it('should return the next id', () => {
    expect(getNextRuleId([])).toBe(0)

    expect(getNextRuleId([{ id: 0 }, { id: 4 }])).toBe(5)
    expect(getNextRuleId([{ id: 6 }, { id: 2 }])).toBe(7)
  })
})
