const cli = require('./cli')

describe('parseCozyURL', () => {
  it('check if no trailing slash is present in url', async () => {
    const urlIn = 'https://toto.mycozy.cloud'

    expect(cli.parseCozyURL(urlIn)).toBe('https://toto.mycozy.cloud')
  })

  it('check if trailing slash is removed', async () => {
    const urlIn = 'https://toto.mycozy.cloud/'

    expect(cli.parseCozyURL(urlIn)).toBe('https://toto.mycozy.cloud')
  })

  it('check if app suffix is removed', async () => {
    const urlIn = 'https://toto-drive.mycozy.cloud/'

    expect(cli.parseCozyURL(urlIn)).toBe('https://toto.mycozy.cloud')
  })

  it("should throw an error if the url doesn't start with 'http'", async () => {
    const cozyUrl = 'toto.mycozy.cloud'

    try {
      cli.parseCozyURL(cozyUrl)
    } catch (e) {
      expect(e.message).toMatch('Cozy url must start with `http`')
    }
  })
})
