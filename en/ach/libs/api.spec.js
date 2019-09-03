const mkAPI = require('./api')

describe('API', () => {
  const fetchJSONSpy = jest.fn()
  const fakeClient = {
    fetchJSON: fetchJSONSpy
  }
  const api = mkAPI(fakeClient)

  afterAll(() => {
    jest.resetAllMocks()
  })

  describe('createDoctype', () => {
    it('should create a new doctype', async () => {
      await api.createDoctype('io.cozy.carrots')
      expect(fetchJSONSpy).toHaveBeenCalledWith('PUT', '/data/io.cozy.carrots/')
    })

    it('should not fail if doctype already exists', async () => {
      fetchJSONSpy.mockRejectedValue({
        reason: { error: 'file_exists' }
      })
      const result = await api.createDoctype('io.cozy.carrots')
      expect(fetchJSONSpy).toHaveBeenCalledWith('PUT', '/data/io.cozy.carrots/')
      expect(result).toEqual({
        ok: true,
        alreadyExists: true
      })
    })
  })
})
