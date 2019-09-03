const {
  findKonnectorSlug,
  fixAccountsWithoutAccountType
} = require('./fixAccountType')

const triggers = [
  {
    arguments: '0 0 0 * * *',
    domain: 'recette.cozy.works',
    message: {
      Data:
        'eyJrb25uZWN0b3IiOiJib3V5Z3Vlc3RlbGVjb20iLCJhY2NvdW50IjoiYjRlNGMyNGVhOGJjMjJjYTg4OTUwYTBkZGQxMjI3NDkiLCJmb2xkZXJUb1NhdmUiOiIwZGUzY2NjNTRmNDhmNTgwYjY1Y2I0YmU1ODAxNDVlYSJ9',
      Type: 'json'
    },
    options: null,
    type: '@cron',
    worker: 'konnector'
  },
  {
    arguments: '0 0 0 * * *',
    domain: 'recette.cozy.works',
    message: {
      Data:
        'eyJrb25uZWN0b3IiOiJoYXJtb25pZSIsImFjY291bnQiOiJlNWM2MzE1MzRjZTlhYTY0YjY5YjBjMGM5NDEyZDNmMiIsImZvbGRlclRvU2F2ZSI6ImU1YzYzMTUzNGNlOWFhNjRiNjliMGMwYzk0MTJjOTM2In0=',
      Type: 'json'
    },
    options: null,
    type: '@cron',
    worker: 'konnector'
  },
  {
    arguments: '0 0 0 * * *',
    domain: 'recette.cozy.works',
    message: {
      Data:
        'eyJrb25uZWN0b3IiOiJ0cmFpbmxpbmUiLCJhY2NvdW50IjoiYjRlNGMyNGVhOGJjMjJjYTg4OTUwYTBkZGQwMTZjODEiLCJmb2xkZXJUb1NhdmUiOiIwZGUzY2NjNTRmNDhmNTgwYjY1Y2I0YmU1ODA5ZDVlMCJ9',
      Type: 'json'
    },
    options: null,
    type: '@cron',
    worker: 'konnector'
  },
  {
    arguments: '0 0 0 * * *',
    domain: 'recette.cozy.works',
    message: {
      Data:
        'eyJrb25uZWN0b3IiOiJ0cmFpbmxpbmUiLCJhY2NvdW50IjoiYjRlNGMyNGVhOGJjMjJjYTg4OTUwYTBkZGQwMDY2NzMiLCJmb2xkZXJUb1NhdmUiOiIwZGUzY2NjNTRmNDhmNTgwYjY1Y2I0YmU1ODA5ZDVlMCJ9',
      Type: 'json'
    },
    options: null,
    type: '@cron',
    worker: 'konnector'
  },
  {
    arguments: '0 0 0 * * *',
    domain: 'recette.cozy.works',
    message: {
      Data:
        'eyJrb25uZWN0b3IiOiJ0cmFpbmxpbmUiLCJhY2NvdW50IjoiYjRlNGMyNGVhOGJjMjJjYTg4OTUwYTBkZGQwOTE5MDEiLCJmb2xkZXJUb1NhdmUiOiIwZGUzY2NjNTRmNDhmNTgwYjY1Y2I0YmU1ODA5ZDVlMCJ9',
      Type: 'json'
    },
    options: null,
    type: '@cron',
    worker: 'konnector'
  },
  {
    arguments: '0 0 0 * * *',
    domain: 'recette.cozy.works',
    message: {
      Data:
        'eyJrb25uZWN0b3IiOiJ0cmFpbmxpbmUiLCJhY2NvdW50IjoiZDk2ZWZjZGE1NThkZDMxNjY4ODYzMzgxZGYwYTZkNDMiLCJmb2xkZXJUb1NhdmUiOiIwZGUzY2NjNTRmNDhmNTgwYjY1Y2I0YmU1ODA5ZDVlMCJ9',
      Type: 'json'
    },
    options: null,
    type: '@cron',
    worker: 'konnector'
  },
  {
    arguments: '0 0 0 * * *',
    domain: 'recette.cozy.works',
    message: {
      Data:
        'eyJrb25uZWN0b3IiOiJ0cmFpbmxpbmUiLCJhY2NvdW50IjoiZTVjNjMxNTM0Y2U5YWE2NGI2OWIwYzBjOTQwYTUwYzgiLCJmb2xkZXJUb1NhdmUiOiIwZGUzY2NjNTRmNDhmNTgwYjY1Y2I0YmU1ODA5ZDVlMCJ9',
      Type: 'json'
    },
    options: null,
    type: '@cron',
    worker: 'konnector'
  },
  {
    arguments: '0 0 0 * * *',
    domain: 'recette.cozy.works',
    message: {
      Data:
        'eyJrb25uZWN0b3IiOiJ0cmFpbmxpbmUiLCJhY2NvdW50IjoiZTVjNjMxNTM0Y2U5YWE2NGI2OWIwYzBjOTQxNzA3MTciLCJmb2xkZXJUb1NhdmUiOiIwZGUzY2NjNTRmNDhmNTgwYjY1Y2I0YmU1ODA5ZDVlMCJ9',
      Type: 'json'
    },
    options: null,
    type: '@cron',
    worker: 'konnector'
  },
  {
    arguments: '0 0 0 * * *',
    domain: 'recette.cozy.works',
    message: {
      Data:
        'eyJrb25uZWN0b3IiOiJmcmVlIiwiYWNjb3VudCI6ImQ5NmVmY2RhNTU4ZGQzMTY2ODg2MzM4MWRmMDk0ZDNiIiwiZm9sZGVyVG9TYXZlIjoiZDk2ZWZjZGE1NThkZDMxNjY4ODYzMzgxZGYwMThkZDMifQ==',
      Type: 'json'
    },
    options: null,
    type: '@cron',
    worker: 'konnector'
  },
  {
    arguments: '0 0 0 * * *',
    domain: 'recette.cozy.works',
    message: {
      Data:
        'eyJrb25uZWN0b3IiOiJ0cmFpbmxpbmUiLCJhY2NvdW50IjoiMGRlM2NjYzU0ZjQ4ZjU4MGI2NWNiNGJlNTgwOWRjODEiLCJmb2xkZXJUb1NhdmUiOiIwZGUzY2NjNTRmNDhmNTgwYjY1Y2I0YmU1ODA5ZDVlMCJ9',
      Type: 'json'
    },
    options: null,
    type: '@cron',
    worker: 'konnector'
  },
  {
    arguments: '0 0 0 * * *',
    domain: 'recette.cozy.works',
    message: {
      Data:
        'eyJrb25uZWN0b3IiOiJmcmVlbW9iaWxlIiwiYWNjb3VudCI6ImU1YzYzMTUzNGNlOWFhNjRiNjliMGMwYzk0MDM1MzFjIiwiZm9sZGVyVG9TYXZlIjoiZTVjNjMxNTM0Y2U5YWE2NGI2OWIwYzBjOTQwMzUxMDgifQ==',
      Type: 'json'
    },
    options: null,
    type: '@cron',
    worker: 'konnector'
  },
  {
    arguments: '0 0 0 * * 3',
    domain: 'recette.cozy.works',
    message: {
      Data:
        'eyJrb25uZWN0b3IiOiJib3V5Z3Vlc3RlbGVjb20iLCJhY2NvdW50IjoiZTY3ZmYzYWVlNzUwNzVkZWVlYTZmZGFkZTVkZWQwMjMiLCJmb2xkZXJfdG9fc2F2ZSI6ImIyMmI1YjMzZTdjZGM1YTg1OTM2NmM1YTgyZWEwMTJkIn0=',
      Type: 'json'
    },
    options: null,
    type: '@cron',
    worker: 'konnector'
  },
  {
    arguments: '0 53 1 * * 4',
    debounce: '',
    domain: 'patrick.mycozy.cloud',
    message: {
      account: '19e2519131deafeb36dad34076dbdf3e',
      folder_to_save: 'b98f2731a5d8fe66df81444918cdf0c8',
      konnector: 'freemobile'
    },
    options: null,
    type: '@cron',
    worker: 'konnector'
  },
  {
    arguments: '0 13 3 * * 4',
    debounce: '',
    domain: 'patrick.mycozy.cloud',
    message: {
      account: 'b98f2731a5d8fe66df81444918d3d98b',
      folder_to_save: '5674954d7968249616225d25d99ae946',
      konnector: 'trainline'
    },
    options: null,
    type: '@cron',
    worker: 'konnector'
  },
  {
    arguments: '0 32 2 * * 4',
    debounce: '',
    domain: 'patrick.mycozy.cloud',
    message: {
      account: 'b98f2731a5d8fe66df81444918cbf151',
      folder_to_save: '19e2519131deafeb36dad34076d99057',
      konnector: 'ameli'
    },
    options: null,
    type: '@cron',
    worker: 'konnector'
  },
  {
    arguments: '0 20 6 * * *',
    debounce: '',
    domain: 'patrick.mycozy.cloud',
    message: {
      account: 'aecec1e34b848129deeed4ccd2818e60',
      konnector: 'bnpparibas82'
    },
    options: null,
    type: '@cron',
    worker: 'konnector'
  }
]

const expected = {
  b4e4c24ea8bc22ca88950a0ddd006673: 'trainline',
  b4e4c24ea8bc22ca88950a0ddd091901: 'trainline',
  d96efcda558dd31668863381df0a6d43: 'trainline',
  e5c631534ce9aa64b69b0c0c940a50c8: 'trainline',
  e5c631534ce9aa64b69b0c0c94170717: 'trainline',
  d96efcda558dd31668863381df094d3b: 'free',
  '0de3ccc54f48f580b65cb4be5809dc81': 'trainline',
  e5c631534ce9aa64b69b0c0c9403531c: 'freemobile',
  e67ff3aee75075deeea6fdade5ded023: 'bouyguestelecom',
  '19e2519131deafeb36dad34076dbdf3e': 'freemobile',
  b98f2731a5d8fe66df81444918d3d98b: 'trainline',
  b98f2731a5d8fe66df81444918cbf151: 'ameli',
  aecec1e34b848129deeed4ccd2818e60: 'bnpparibas82'
}

const asyncResolve = data => {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), 1)
  })
}

describe('fix account type', () => {
  let client, log
  beforeEach(() => {
    log = console.log
    console.log = jest.fn()
    client = {
      data: {
        defineIndex: function() {
          return 'INDEX'
        }
      }
    }
  })

  afterEach(() => {
    console.log = log
  })

  describe('find trigger data', () => {
    it('should find the correct konnector', () => {
      Object.keys(expected).forEach(accountId => {
        const expectedKonnector = expected[accountId]
        const account = { _id: accountId }
        const konnector = findKonnectorSlug(triggers, account)
        expect(konnector).toBe(expectedKonnector)
      })
    })
  })

  describe('fix accounts', () => {
    it('should add account_type to the account', async () => {
      const accounts = Object.keys(expected).map(x => ({ _id: x }))
      client.data.query = jest
        .fn()
        .mockImplementationOnce(() => asyncResolve(accounts))
        .mockImplementationOnce(() => asyncResolve(triggers))
      return fixAccountsWithoutAccountType(client).then(() => {
        expect(accounts[0].account_type).toBe('trainline')
        expect(accounts[5].account_type).toBe('free')
      })
    })
  })
})
