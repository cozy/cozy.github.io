import { createAutoGroups, removeDuplicateAccountsFromGroups } from './services'
import { createMockClient } from 'cozy-client'
import { GROUP_DOCTYPE, ACCOUNT_DOCTYPE, schema } from 'doctypes'
import { fetchSettings } from 'ducks/settings/helpers'

jest.mock('ducks/settings/helpers')

describe('createAutoGroups', () => {
  const setup = ({ remote, processedAccounts }) => {
    const client = createMockClient({
      remote,
      clientOptions: { schema }
    })

    client.save = jest.fn()

    const settings = {
      autogroups: {
        processedAccounts
      }
    }

    fetchSettings.mockResolvedValue(settings)

    return { client, settings }
  }
  describe('when the automatic group does not exist', () => {
    it('should create a new automatic group', async () => {
      const { client, settings } = setup({
        remote: {
          [ACCOUNT_DOCTYPE]: [{ _id: 'a1', type: 'Checkings' }]
        },
        processedAccounts: []
      })

      await createAutoGroups({ client })

      expect(client.save).toHaveBeenCalledWith(
        expect.objectContaining({
          accountType: 'Checkings',
          accounts: expect.objectContaining({
            raw: ['a1']
          })
        })
      )

      expect(settings.autogroups.processedAccounts).toEqual(['a1'])
    })
  })

  describe('when the automatic group already exists', () => {
    it('should add accounts to the existing group', async () => {
      const { client, settings } = setup({
        remote: {
          [GROUP_DOCTYPE]: [
            {
              _id: 'checkings_auto',
              accountType: 'Checkings',
              accounts: ['a1', 'a1']
            }
          ],
          [ACCOUNT_DOCTYPE]: [{ _id: 'a2', type: 'Checkings' }]
        },
        processedAccounts: ['a1']
      })

      await createAutoGroups({ client })

      expect(client.save).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'checkings_auto',
          _type: GROUP_DOCTYPE,
          accountType: 'Checkings',
          accounts: ['a1', 'a2']
        })
      )

      expect(settings.autogroups.processedAccounts).toEqual(['a1', 'a2'])

      // Due to account deduplication
      expect(client.save).toHaveBeenCalledTimes(3)
    })
  })

  describe('duplicate accounts removal', () => {
    it('should remove duplicate accounts from an existing group', async () => {
      const { client } = setup({
        remote: {
          [GROUP_DOCTYPE]: [
            {
              _id: 'checkings_auto',
              accountType: 'Checkings',
              accounts: ['a1', 'a1']
            }
          ],
          [ACCOUNT_DOCTYPE]: [{ _id: 'a2', type: 'Checkings' }]
        },
        processedAccounts: ['a1']
      })

      await removeDuplicateAccountsFromGroups(client)

      expect(client.save).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'checkings_auto',
          accountType: 'Checkings',
          accounts: ['a1']
        })
      )
    })
  })
})
