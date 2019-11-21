import { linkMyselfToAccounts, unlinkMyselfFromAccounts } from './services'
import { createClientWithData } from 'test/client'
import { ACCOUNT_DOCTYPE, CONTACT_DOCTYPE } from 'doctypes'
import { fetchSettings } from 'ducks/settings/helpers'
import get from 'lodash/get'

jest.mock('ducks/settings/helpers')

fetchSettings.mockResolvedValue({
  linkMyselfToAccounts: {
    processedAccounts: []
  }
})

const myself = { _id: 'myself', me: true }
const isAccountLinkedToMyself = account => {
  const owners = get(account, 'relationships.owners.data', [])

  return owners.some(owner => owner._id === myself._id)
}

describe('linkMyselfToAccounts', () => {
  describe('when myself contact exists', () => {
    it('should link all accounts to myself contact', async () => {
      const accounts = [
        { _id: 'a1' },
        {
          _id: 'a2',
          relationships: {
            owners: {
              data: [{ _id: 'c1', _type: CONTACT_DOCTYPE }]
            }
          }
        }
      ]

      const client = createClientWithData({
        data: {
          [ACCOUNT_DOCTYPE]: accounts,
          [CONTACT_DOCTYPE]: [myself]
        }
      })

      await linkMyselfToAccounts({ client })

      expect(accounts.every(isAccountLinkedToMyself)).toBe(true)
    })
  })

  describe('when myself contact does not exist', () => {
    it('should bail out', async () => {
      const accounts = [
        { _id: 'a1' },
        {
          _id: 'a2',
          relationships: {
            owners: {
              data: [{ _id: 'c1', _type: CONTACT_DOCTYPE }]
            }
          }
        }
      ]

      const client = createClientWithData({
        data: {
          [ACCOUNT_DOCTYPE]: accounts
        }
      })

      await linkMyselfToAccounts({ client })

      expect(accounts.every(isAccountLinkedToMyself)).toBe(false)
    })
  })
})

describe('unlinkMyselfToAccounts', () => {
  describe('when myself contact exists', () => {
    it('should unlink myself contact from all accounts', async () => {
      const myselfRel = { _id: myself._id, _type: CONTACT_DOCTYPE }

      const accounts = [
        {
          _id: 'a1',
          relationships: {
            owners: {
              data: [myselfRel]
            }
          }
        },
        {
          _id: 'a2',
          relationships: {
            owners: {
              data: [myselfRel]
            }
          }
        }
      ]

      const client = createClientWithData({
        data: {
          [ACCOUNT_DOCTYPE]: accounts,
          [CONTACT_DOCTYPE]: [myself]
        }
      })

      await unlinkMyselfFromAccounts({ client })

      expect(accounts.every(isAccountLinkedToMyself)).toBe(false)
    })
  })

  describe('when myself contact does not exist', () => {
    it('should bail out', async () => {
      const myselfRel = { _id: myself._id, _type: CONTACT_DOCTYPE }

      const accounts = [
        {
          _id: 'a1',
          relationships: {
            owners: {
              data: [myselfRel]
            }
          }
        },
        {
          _id: 'a2',
          relationships: {
            owners: {
              data: [myselfRel]
            }
          }
        }
      ]

      const client = createClientWithData({
        data: {
          [ACCOUNT_DOCTYPE]: accounts
        }
      })

      await unlinkMyselfFromAccounts({ client })

      expect(accounts.every(isAccountLinkedToMyself)).toBe(true)
    })
  })
})
