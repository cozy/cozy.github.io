jest.mock('cozy-logger', () => ({
  namespace: () => jest.fn()
}))

const { utils, log } = require('./createAggregatorAccount')

describe('create aggregator account', () => {
  let originalUtils = { ...utils }
  let client,
    fetchJSON,
    existingAccounts = [],
    existingBankingAgg,
    existingKonnectors = []
  beforeEach(() => {
    Object.assign(utils, originalUtils)
    log.mockReset()
  })

  const setupClient = () => {
    fetchJSON = jest.fn().mockImplementation(async (method, path) => {
      if (method === 'GET' && path === '/data/io.cozy.accounts/_normal_docs') {
        return {
          rows: existingAccounts
        }
      } else if (
        method === 'GET' &&
        path === '/data/io.cozy.accounts/bi-aggregator'
      ) {
        return existingBankingAgg
      } else if (method === 'GET' && path === '/konnectors/') {
        return existingKonnectors
      }
    })
    client = {
      fetchJSON,
      data: {
        updateAttributes: jest.fn()
      }
    }
  }

  it('should abort if no banking konnector are installed', async () => {
    setupClient()
    await utils.run({}, client, false)
    expect(log).toHaveBeenCalledWith(
      'info',
      'No banking konnector, aborting...'
    )
  })

  it('should add the aggregator account if it does not exist', async () => {
    setupClient()
    existingKonnectors = [{ attributes: { slug: 'caissedepargne1' } }]
    await utils.run({}, client, false)
    expect(client.fetchJSON).toHaveBeenCalledWith(
      'PUT',
      '/data/io.cozy.accounts/bi-aggregator',
      expect.any(Object)
    )
  })

  it('should not add the aggregator account if it exists', async () => {
    setupClient()
    existingBankingAgg = {}
    existingKonnectors = [{ attributes: { slug: 'caissedepargne1' } }]
    await utils.run({}, client, false)
    expect(client.fetchJSON).not.toHaveBeenCalledWith(
      'PUT',
      '/data/io.cozy.accounts/bi-aggregator',
      expect.any(Object)
    )
  })

  it('should add permissions', async () => {
    setupClient()
    existingBankingAgg = {}
    existingKonnectors = [{ attributes: { slug: 'caissedepargne1' } }]
    await utils.run({}, client, false)
    expect(client.fetchJSON).toHaveBeenCalledWith(
      'PATCH',
      '/permissions/konnectors/caissedepargne1',
      expect.objectContaining({
        data: {
          attributes: {
            permissions: {
              aggregatorAccount: {
                type: 'io.cozy.accounts',
                values: ['io.cozy.accounts.bi-aggregator'],
                verbs: ['GET', 'PUT']
              }
            }
          },
          type: 'io.cozy.permissions'
        }
      })
    )
  })

  it('should add relationship to accounts', async () => {
    setupClient()
    existingBankingAgg = {}
    existingKonnectors = [{ attributes: { slug: 'caissedepargne1' } }]
    existingAccounts = [
      { _id: '1234', account_type: 'caissedepargne1' },
      { _id: '5678', account_type: 'hellobank145' }
    ]
    await utils.run({}, client, false)
    expect(client.data.updateAttributes).toHaveBeenCalledWith(
      'io.cozy.accounts',
      '1234',
      {
        relationships: {
          parent: {
            data: { _id: 'bi-aggregator', _type: 'io.cozy.accounts' }
          }
        }
      }
    )
    expect(client.data.updateAttributes).toHaveBeenCalledWith(
      'io.cozy.accounts',
      '5678',
      {
        relationships: {
          parent: {
            data: { _id: 'bi-aggregator', _type: 'io.cozy.accounts' }
          }
        }
      }
    )
  })
})
