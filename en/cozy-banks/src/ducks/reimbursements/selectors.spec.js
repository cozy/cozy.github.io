import { getHealthReimbursementLateLimitSelector } from './selectors'

describe('getHealthReimbursementLateLimitSelector', () => {
  describe('when it is not configured', () => {
    it('should return the health reimbursement late limit by default', () => {
      const state = {}
      const v = getHealthReimbursementLateLimitSelector(state)
      expect(v).toBe(30)
    })
  })

  describe('when it is configured', () => {
    it('should return the health reimbursement late limit', () => {
      const state = {
        cozy: {
          queries: {
            settings: {
              data: [
                {
                  notifications: {
                    lateHealthReimbursement: {
                      value: 10
                    }
                  }
                }
              ]
            }
          }
        }
      }
      const v = getHealthReimbursementLateLimitSelector(state)
      expect(v).toBe(10)
    })
  })
})
