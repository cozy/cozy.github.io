import { removeStats } from './accounts'
import CozyClient from 'cozy-client'

jest.mock('cozy-client')

const client = new CozyClient()

describe('removeStats', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should remove the stats doc corresponding to the account if it exists', async () => {
    const account = { _id: 'account' }
    const stats = { _id: 'stats' }
    client.query.mockResolvedValueOnce({ data: [stats] })

    await removeStats(client, account)

    expect(client.destroy).toHaveBeenCalledWith(stats)
  })

  it('should do nothing if no stats doc corresponding to the account exist', async () => {
    const account = { _id: 'account' }
    client.query.mockResolvedValueOnce({ data: [] })

    await removeStats(client, account)

    expect(client.destroy).not.toHaveBeenCalled()
  })
})
