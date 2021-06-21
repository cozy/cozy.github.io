const cli = require('./cli')

describe('cli', () => {
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
})
