import { deleteOrphanOperations, onAccountDelete } from './accounts'
import CozyClient from 'cozy-client'
import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'

const setup = () => {
  const client = new CozyClient({})
  client.query = jest.fn()
  client.destroy = jest.fn()
  client.saveAll = jest.fn()
  const collection = {
    find: jest.fn(),
    destroyAll: jest.fn()
  }
  client.stackClient.collection = () => collection
  return { client, collection }
}

describe('remove orphan transactions', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should remove the orphan transactions', async () => {
    const { client, collection } = setup()
    const account = { _id: 'account' }
    const orphans = [{ _id: 't1' }, { _id: 't2' }]
    collection.find.mockResolvedValueOnce({ data: orphans })
    await deleteOrphanOperations(client, account)
    expect(collection.destroyAll).toHaveBeenCalledWith(orphans)
  })

  it('should remove the orphan transactions 2', async () => {
    const { client, collection } = setup()
    const account = { _id: 'account' }
    const orphans1 = Array(100)
      .fill(null)
      .map((x, i) => ({ _id: `t${i}` }))
    const orphans2 = Array(5)
      .fill(null)
      .map((x, i) => ({ _id: `t${i}` }))
    collection.find
      .mockResolvedValueOnce({ data: orphans1 })
      .mockResolvedValueOnce({ data: orphans2 })
    await deleteOrphanOperations(client, account)
    expect(collection.destroyAll).toHaveBeenCalledWith(orphans1)
    expect(collection.destroyAll).toHaveBeenCalledWith(orphans2)
  })
})

describe('onAccountDelete', () => {
  beforeEach(() => {
    jest.spyOn(Alerter, 'info')
    jest.spyOn(Alerter, 'success')
    jest.spyOn(Alerter, 'removeNotification')
  })
  afterEach(() => {
    Alerter.info.mockReset()
    Alerter.success.mockReset()
    Alerter.removeNotification.mockReset()
  })
  it('should add an alert and remove it', async () => {
    const { client, collection } = setup()
    collection.find.mockResolvedValue({
      data: [],
      count: 0
    })
    client.query.mockResolvedValue({
      data: []
    })
    client.saveAll.mockResolvedValue({
      data: []
    })
    const cozyData = JSON.stringify({ locale: 'en' })
    document.body.innerHTML = `<div role="application" data-cozy=${cozyData}></div>`

    await onAccountDelete(client, 'account-id')
    expect(Alerter.info).toHaveBeenCalled()
    expect(Alerter.removeNotification).toHaveBeenCalled()
  })
})
