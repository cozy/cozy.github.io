jest.mock('node-fetch')
jest.mock('./config')

const fetch = require('node-fetch')
const { createToken } = require('./admin')

describe('admin', () => {
  beforeEach(() => {
    fetch.mockReturnValue(
      Promise.resolve({
        status: 200,
        text: () => Promise.resolve('token')
      })
    )
  })

  it('should send the right request', async () => {
    await createToken('fakedomain.cozy.rocks', ['io.cozy.todos'])
    expect(fetch).toHaveBeenCalledWith(
      'https://admin/instances/token?Domain=fakedomain.cozy.rocks&Audience=cli&Scope=io.cozy.todos',
      {
        agent: expect.anything(),
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-type': 'application/json',
          Authorization: 'Basic dXNlcjpwYXNzd29yZA=='
        }
      }
    )
  })
})
