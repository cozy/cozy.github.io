const { fetchSettings } = require('./helpers')

describe('defaulted settings', () => {
  it('should return defaulted settings', async () => {
    const fakeClient = {
      find: () => {},
      query: () => {
        return Promise.resolve({
          data: [
            {
              pin: '1234'
            },
            {
              notifications: {
                balanceLower: {
                  value: 600,
                  enabled: false
                }
              }
            }
          ]
        })
      }
    }
    const settings = await fetchSettings(fakeClient)
    expect(settings).toMatchSnapshot()
  })
})
