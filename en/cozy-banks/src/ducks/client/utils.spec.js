const { isRevoked, getDocumentIdentity } = require('./utils')

describe('isRevoked', () => {
  let fetchInformation, client

  beforeAll(() => {
    client = {
      stackClient: {
        fetchInformation: () => {
          return fetchInformation()
        }
      }
    }
  })

  it('should detect revocation', async () => {
    fetchInformation = async () => {
      throw new Error('Client not found')
    }
    const revoked = await isRevoked(client)
    expect(revoked).toBe(true)
  })

  it('should not trigger false positives 1', async () => {
    fetchInformation = async () => {
      throw new Error('No internet')
    }
    const revoked = await isRevoked(client)
    expect(revoked).toBe(false)
  })

  it('should not trigger false positives 2', async () => {
    fetchInformation = async () => {
      return
    }
    const revoked = await isRevoked(client)
    expect(revoked).toBe(false)
  })
})

describe('fully dehydratation', () => {
  it('should only keep _id and _type', () => {
    expect(
      getDocumentIdentity({
        _id: 'homer',
        _type: 'simpson',
        name: 'Homer'
      })
    ).toEqual({ _id: 'homer', _type: 'simpson' })
  })

  it('should support passing null', () => {
    expect(getDocumentIdentity(null)).toEqual(null)
  })
})
