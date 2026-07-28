import Request from './request'

describe('[Interapp] Request', () => {
  let request, cozyClient

  beforeEach(() => {
    cozyClient = {
      stackClient: {
        fetchJSON: jest.fn().mockReturnValue(Promise.resolve({ data: [] }))
      }
    }
    request = new Request(cozyClient)
  })

  it('should initialise with stackClient', () => {
    expect(request.stackClient).toEqual(cozyClient.stackClient)
  })

  describe('get', () => {
    it('should fetch intent by id', async () => {
      cozyClient.stackClient.fetchJSON.mockReturnValue(
        Promise.resolve({
          data: { id: 'intent-1', attributes: { action: 'PICK' } }
        })
      )

      const intent = await request.get('intent-1')
      expect(cozyClient.stackClient.fetchJSON).toHaveBeenCalledWith(
        'GET',
        '/intents/intent-1'
      )
      expect(intent._id).toBe('intent-1')
      expect(intent.attributes.action).toBe('PICK')
    })

    it('should not override existing _id', async () => {
      cozyClient.stackClient.fetchJSON.mockReturnValue(
        Promise.resolve({
          data: { _id: 'custom-id', id: 'intent-1' }
        })
      )

      const intent = await request.get('intent-1')
      expect(intent._id).toBe('custom-id')
    })

    it('should return intent from DOM when tryDOM is true and element exists', async () => {
      const node = document.createElement('div')
      node.id = 'cozy-intent'
      node.textContent = JSON.stringify({
        id: 'dom-intent',
        attributes: { action: 'VIEW' }
      })
      document.body.appendChild(node)

      const intent = await request.get('dom-intent', { tryDOM: true })
      expect(intent._id).toBe('dom-intent')
      expect(intent.attributes.action).toBe('VIEW')
      expect(cozyClient.stackClient.fetchJSON).not.toHaveBeenCalled()
      document.body.removeChild(node)
    })

    it('should fall back to API when tryDOM is true but DOM element is missing', async () => {
      cozyClient.stackClient.fetchJSON.mockReturnValue(
        Promise.resolve({
          data: { id: 'api-intent', attributes: { action: 'PICK' } }
        })
      )

      const intent = await request.get('api-intent', { tryDOM: true })
      expect(intent.id).toBe('api-intent')
      expect(cozyClient.stackClient.fetchJSON).toHaveBeenCalledWith(
        'GET',
        '/intents/api-intent'
      )
    })

    it('should use default tryDOM=false when no options passed', async () => {
      cozyClient.stackClient.fetchJSON.mockReturnValue(
        Promise.resolve({ data: { id: 'default' } })
      )

      await request.get('default')
      expect(cozyClient.stackClient.fetchJSON).toHaveBeenCalled()
    })
  })

  describe('fromDOM', () => {
    it('should return undefined when element does not exist', () => {
      const result = request.fromDOM()
      expect(result).toBeUndefined()
    })

    it('should parse and normalize intent from DOM element', () => {
      const node = document.createElement('div')
      node.id = 'cozy-intent'
      node.textContent = JSON.stringify({
        id: 'dom-intent',
        attributes: { action: 'SHARE' }
      })
      document.body.appendChild(node)

      const result = request.fromDOM()
      expect(result._id).toBe('dom-intent')
      expect(result.attributes.action).toBe('SHARE')
      document.body.removeChild(node)
    })
  })

  describe('error handling', () => {
    it('should propagate fetchJSON rejection', async () => {
      const error = new Error('Network error')
      cozyClient.stackClient.fetchJSON.mockReturnValue(Promise.reject(error))

      await expect(request.get('fail')).rejects.toThrow('Network error')
    })
  })
})
