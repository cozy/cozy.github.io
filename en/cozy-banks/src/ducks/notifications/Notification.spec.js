import Notification from './Notification'

describe('Notification', () => {
  it('should instantiate correctly', () => {
    const config = {
      t: () => {},
      data: {},
      cozyClient: { _url: 'http://cozy.tools' }
    }

    const notification = new Notification(config)

    expect(notification).toBeDefined()
  })
})
