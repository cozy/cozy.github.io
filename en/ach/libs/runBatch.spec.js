const fetch = require('node-fetch')
global.fetch = fetch
jest.mock('pouchdb-browser', () => () => {})
jest.mock('./getClient', () => jest.fn())

const CozyClient = require('cozy-client').default

const getClient = require('./getClient')
const runBatch = require('./runBatch')

jest.mock('./log', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  success: jest.fn()
}))

jest.mock('./admin', () => ({
  createToken: jest.fn().mockReturnValue('mock-token')
}))

jest.mock('./config', () => ({
  loadConfig: () => {},
  getAdminConfigForDomain: () => {}
}))

describe('batch', () => {
  beforeEach(() => {
    // Return a fake cozy-client-js
    getClient.mockImplementation(async (token, url) => {
      return {
        _token: {
          token: token
        },
        _url: url
      }
    })
  })

  const setup = () => {
    const script = {
      // A script that computes the reversed domain of the cozy
      // It also counts the number of cozies
      run: jest.fn().mockImplementation(ctx => {
        const { client, stats } = ctx
        stats.count = stats.count || 0
        stats.count++
        return {
          reversedDomain: client.options.uri
            .split('')
            .reverse()
            .join('')
        }
      }),

      getDoctypes: () => ['io.cozy.accounts']
    }
    return { script }
  }

  it('should work', async () => {
    const { script } = setup()
    const res = await runBatch({
      domains: [
        'abcde.mycozy.cloud',
        'fghij.mycozy.cloud',
        'klmno.mycozy.cloud'
      ],
      script,
      logResults: false
    })

    expect(script.run).toHaveBeenCalledTimes(3)
    expect(script.run).toHaveBeenCalledWith({
      client: expect.any(CozyClient),
      dryRun: true,
      logger: expect.any(Object),
      stats: expect.any(Object)
    })
    expect(res.stats.count).toBe(3)
    expect(res.results.map(r => r.reversedDomain)).toEqual([
      'duolc.yzocym.edcba//:sptth',
      'duolc.yzocym.jihgf//:sptth',
      'duolc.yzocym.onmlk//:sptth'
    ])
    expect(res.results.filter(x => x.error)).toHaveLength(0)
  })

  it('should return errors', async () => {
    const { script } = setup()

    // Modify the script so that it returns an error
    const originalRun = script.run
    let i = -1
    const updatedRun = function() {
      i++
      if (i == 1) {
        throw new Error('Unknown error')
      } else {
        return originalRun.apply(this, arguments)
      }
    }
    script.run = jest.fn().mockImplementation(updatedRun)

    const res = await runBatch({
      domains: [
        'abcde.mycozy.cloud',
        'fghij.mycozy.cloud',
        'klmno.mycozy.cloud'
      ],
      script,
      logResults: false
    })

    expect(script.run).toHaveBeenCalledTimes(3)
    expect(script.run).toHaveBeenCalledWith({
      client: expect.any(CozyClient),
      dryRun: true,
      logger: expect.any(Object),
      stats: expect.any(Object)
    })
    expect(res.stats.count).toBe(2)
    expect(
      res.results.filter(x => !x.error).map(r => r.reversedDomain)
    ).toEqual(['duolc.yzocym.edcba//:sptth', 'duolc.yzocym.onmlk//:sptth'])
    expect(res.results.filter(x => x.error)).toEqual([
      {
        domain: 'fghij.mycozy.cloud',
        error: {
          message: 'Unknown error',
          stack: expect.any(String)
        }
      }
    ])
  })
})
