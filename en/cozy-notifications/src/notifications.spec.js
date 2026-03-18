import appLayout from './__tests__/app-layout.hbs'
import emailTemplate from './__tests__/email-layout.hbs'
import { sendNotification } from './notifications'
import NotificationView from './view'

class MyNotificationView extends NotificationView {
  async fetchData() {
    this.name = 'patrick'
  }

  async prepare() {
    await this.fetchData()
  }

  buildData() {
    return { name: this.name }
  }

  shouldSend() {
    return true
  }

  getHelpers() {
    return {
      greeting: name => `Hello ${name}!`
    }
  }

  getTitle() {
    return 'Notification title'
  }

  getPushContent() {
    return 'Push content'
  }

  getPartials() {
    return {
      'app-layout': appLayout
    }
  }
}

MyNotificationView.preferredChannels = ['mail', 'mobile']
MyNotificationView.template = emailTemplate
MyNotificationView.category = 'my-category'

describe('notifications', () => {
  const setup = () => {
    const client = {
      stackClient: {
        fetchJSON: jest.fn(),
        uri: 'http://cozy.tools:8080'
      }
    }
    const notificationView = new MyNotificationView({
      client: client,
      lang: 'en',
      data: {
        name: 'Homer'
      },
      locales: {
        en: {
          hello: 'Hello %{name} !'
        }
      }
    })
    return { client, notificationView }
  }

  it('should send a notification view', async () => {
    const { notificationView, client } = setup()
    await sendNotification(client, notificationView)
    expect(client.stackClient.fetchJSON).toMatchSnapshot()
  })

  it('should not send if buildData returns false', async () => {
    const { notificationView, client } = setup()
    notificationView.buildData = jest.fn().mockReturnValue(false)
    await sendNotification(client, notificationView)
    expect(client.stackClient.fetchJSON).not.toHaveBeenCalled()
  })

  it('should not send if shouldSend returns false', async () => {
    const { notificationView, client } = setup()
    notificationView.shouldSend = jest.fn().mockReturnValue(false)
    const data = {}
    notificationView.buildData = () => data
    await sendNotification(client, notificationView)
    expect(notificationView.shouldSend).toHaveBeenCalledWith(data)
    expect(client.stackClient.fetchJSON).not.toHaveBeenCalled()
  })

  it('should call getPushContent with the correct this', async () => {
    const { notificationView, client } = setup()
    expect.assertions(1)
    notificationView.getPushContent = jest.fn().mockImplementation(function () {
      expect(this).toBe(notificationView)
    })
    await sendNotification(client, notificationView)
  })

  it('should set extra attributes', async () => {
    const { notificationView, client } = setup()
    expect.assertions(1)
    notificationView.getExtraAttributes = () => ({ data: { route: '/route' } })
    await sendNotification(client, notificationView)
    expect(client.stackClient.fetchJSON).toHaveBeenCalledWith(
      'POST',
      '/notifications',
      expect.objectContaining({
        data: expect.objectContaining({
          attributes: expect.objectContaining({
            data: {
              route: '/route'
            }
          })
        })
      })
    )
  })
})
