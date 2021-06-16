import { fetchHydratedBundles } from './api'
import CozyClient from 'cozy-client'
import fixtures from 'test/fixtures'
import { TRANSACTION_DOCTYPE, RECURRENCE_DOCTYPE } from 'doctypes'

describe('fetch hydrated bundles', () => {
  const setup = () => {
    const client = new CozyClient()
    client.queryAll = jest.fn().mockImplementation(async qdef => {
      if (qdef.doctype === TRANSACTION_DOCTYPE) {
        return fixtures[TRANSACTION_DOCTYPE]
      } else if (qdef.doctype === RECURRENCE_DOCTYPE) {
        return fixtures[RECURRENCE_DOCTYPE]
      } else {
        throw new Error(`Unexpected doctype ${qdef.doctype} in queryAll`)
      }
    })
    return { client }
  }

  it('should use query all to fetch more than the default pagination limit', async () => {
    const { client } = setup()
    await fetchHydratedBundles(client)
    expect(client.queryAll).toHaveBeenCalledTimes(2)
  })

  it('should use put operations pertaining to the bundle inside the ops attribute', async () => {
    const { client } = setup()
    const bundles = await fetchHydratedBundles(client)
    expect(bundles.length).toBe(3)
    expect(bundles[0].ops.length).toEqual(3)
    expect(bundles[1].ops.length).toEqual(0)
    expect(bundles[2].ops.length).toEqual(0)
  })
})
