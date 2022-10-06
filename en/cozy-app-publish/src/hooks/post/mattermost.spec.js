const { getMessage, sendMattermostReleaseMessage } = require('./mattermost')
const https = require('https')

describe('get message', () => {
  const commonInfo = {
    appSlug: 'banks',
    appVersion: '1.6.1',
    spaceName: 'banks',
    appType: 'webapp'
  }

  const travisVars = {
    TRAVIS_COMMIT_MESSAGE:
      'Beautiful commit title  & a beautiful ampersand \n\nAnd a beautiful explanation',
    TRAVIS_JOB_WEB_URL: 'https://travis.com/cozy/cozy-banks/jobs/jobId1234',
    TRAVIS_REPO_SLUG: 'cozy/cozy-banks',
    TRAVIS_COMMIT: 'sha1deadbeef'
  }

  describe('with travis vars', () => {
    beforeEach(() => {
      Object.assign(process.env, travisVars)
    })

    afterEach(() => {
      Object.keys(travisVars).forEach(k => {
        delete process.env[k]
      })
    })

    it('should work', () => {
      expect(getMessage(commonInfo))
        .toBe(`Application __banks__ version \`1.6.1\` has been published on space __banks__.

- [Last commit: Beautiful commit title  & a beautiful ampersand ](https://github.com/cozy/cozy-banks/commits/sha1deadbeef)
- [Job](https://travis.com/cozy/cozy-banks/jobs/jobId1234)`)
    })
  })

  it('should work', () => {
    expect(getMessage(commonInfo)).toBe(
      `Application __banks__ version \`1.6.1\` has been published on space __banks__.`
    )
  })
})

describe('sendMattermost Post', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    console.log.mockRestore()
  })

  const httpIncomingMessage = {
    statusCode: 200,
    statusMessage: 'OK',
    headers: {
      authorization: 'Bearer mocked token'
    }
  }
  jest.mock('https')
  https.request = jest.fn()
  const commonInfo = {
    appSlug: 'banks',
    appVersion: '1.6.1',
    spaceName: 'banks',
    appType: 'webapp'
  }
  const travisVars = {
    TRAVIS_COMMIT_MESSAGE:
      'Beautiful commit title & a beautiful ampersand 😍 \n\nAnd a beautiful explanation 🤪',
    TRAVIS_JOB_WEB_URL: 'https://travis.com/cozy/cozy-banks/jobs/jobId1234',
    TRAVIS_REPO_SLUG: 'cozy/cozy-banks',
    TRAVIS_COMMIT: 'sha1deadbeef',
    MATTERMOST_HOOK_URL:
      'https://mattermost.cozycloud.cc/hooks/ymcoouqj6fyb5rfq9xyqtenscw',
    MATTERMOST_CHANNEL: 'gh-notif-appvenger'
  }
  describe('with travis vars', () => {
    beforeEach(() => {
      Object.assign(process.env, travisVars)
    })

    afterEach(() => {
      Object.keys(travisVars).forEach(k => {
        delete process.env[k]
      })
    })

    it('should send the right content to mattermost hook', async () => {
      const onSpy = jest.fn()
      const writeSpy = jest.fn()
      const endSpy = jest.fn()
      https.request = jest.fn().mockImplementation((uri, callback) => {
        if (callback) {
          setTimeout(() => callback(httpIncomingMessage), 100)
        }
        return {
          on: onSpy,
          write: writeSpy,
          end: endSpy
        }
      })
      // eslint-disable-next-line no-useless-catch
      try {
        await sendMattermostReleaseMessage(commonInfo)
        expect(JSON.parse(writeSpy.mock.calls[0][0])).toEqual({
          channel: 'gh-notif-appvenger',
          icon_url: 'https://files.cozycloud.cc/travis.png',
          username: 'Travis',
          text: 'Application __banks__ version `1.6.1` has been published on space __banks__.\n\n- [Last commit: Beautiful commit title & a beautiful ampersand 😍 ](https://github.com/cozy/cozy-banks/commits/sha1deadbeef)\n- [Job](https://travis.com/cozy/cozy-banks/jobs/jobId1234)'
        })
        expect(https.request).toHaveBeenCalledWith(
          {
            headers: {
              'Content-Length': 379,
              'Content-Type': 'application/json'
            },
            hostname: 'mattermost.cozycloud.cc',
            method: 'post',
            path: '/hooks/ymcoouqj6fyb5rfq9xyqtenscw'
          },
          expect.any(Function)
        )
      } catch (error) {
        throw error
      }
    })
  })
})
