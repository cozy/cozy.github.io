import util from 'util'

import CozyClient from 'cozy-client'

export default function testFlagAPI(flag) {
  afterEach(() => {
    flag.reset()
  })

  describe('flag', () => {
    it('should return the requested flag when passed a single parameter', () => {
      flag('test', true)
      expect(flag('test')).toBe(true)
    })

    it('should set the flag when passed two parameters', () => {
      expect(flag('test')).toBeNull()

      flag('test', true)
      expect(flag('test')).toBe(true)
    })

    if (flag.store) {
      describe('observable', () => {
        beforeEach(() => {
          jest.spyOn(flag.store, 'emit')
        })
        it('should emit events', () => {
          flag('test', true)
          expect(flag.store.emit).toHaveBeenCalled()
        })
      })
    }

    describe('part of the parameter is embedded in a json content', () => {
      beforeEach(() => {
        flag('test.obj1', {
          obj2: true,
          obj3: {
            obj4: {
              obj5: {
                obj6: {
                  test: true
                },
                obj7: {
                  test: null
                }
              }
            }
          }
        })
      })

      it('should return the requested value when a part of the parameter is embedded', () => {
        expect(flag('test.obj1.obj2')).toBe(true)
      })

      it('should return the requested value when multiple part of the parameter is embedded', () => {
        expect(flag('test.obj1.obj3.obj4.obj5')).toStrictEqual({
          obj6: {
            test: true
          },
          obj7: {
            test: null
          }
        })
      })

      it('should return null when parameter not found', () => {
        expect(flag('test.obj2.obj3')).toBe(null)
      })
    })
  })

  describe('listFlags', () => {
    it('should return all the flag keys sorted', () => {
      const expectedFlags = ['test', 'feature', 'thing']
      expectedFlags.forEach(expectedFlag => flag(expectedFlag, true))

      const flags = flag.list()

      expect(flags).toEqual(['feature', 'test', 'thing'])
    })
  })

  describe('resetFlags', () => {
    it('should reset all the flags', () => {
      ;['test', 'feature', 'thing'].forEach(expectedFlag =>
        flag(expectedFlag, true)
      )

      expect(flag.list()).toHaveLength(3)

      flag.reset()

      expect(flag.list()).toHaveLength(0)
    })
  })

  describe('initialization', () => {
    const remoteFlags = {
      has_feature1: true,
      has_feature2: false,
      number_of_foos: 10,
      bar_config: { qux: 'quux' },
      from_remote: true
    }
    const flagRemoteResponse = {
      data: {
        type: 'io.cozy.settings',
        id: 'io.cozy.settings.flags',
        attributes: remoteFlags,
        links: {
          self: '/settings/flags'
        }
      }
    }

    const domFlags = {
      has_feature1: true,
      has_feature2: false,
      number_of_foos: 10,
      bar_config: { qux: 'quux' },
      from_remote: false
    }

    const setup = () => {
      const client = new CozyClient({})
      client.query = jest.fn(() => flagRemoteResponse)
      return { client }
    }

    describe('cozy-client plugin', () => {
      it('should have a cozy-client plugin', async () => {
        const { client } = setup()
        client.registerPlugin(flag.plugin)
        await client.plugins.flags.handleLogin()
        expect(flag('has_feature1')).toBe(true)
        expect(flag('has_feature2')).toBe(false)
        expect(flag('from_remote')).toBe(true)
        expect(flag('number_of_foos')).toBe(10)
        expect(flag('bar_config')).toEqual({ qux: 'quux' })
      })

      it('should initialize when already logged in', async () => {
        const { client } = setup()
        client.isLogged = true
        client.registerPlugin(flag.plugin)
        const onLogin = jest.fn()
        client.on('plugin:flag:login', onLogin)
        await client.plugins.flags.initializing
        expect(flag('has_feature1')).toBe(true)
        expect(flag('has_feature2')).toBe(false)
        expect(flag('from_remote')).toBe(true)
        expect(flag('number_of_foos')).toBe(10)
        expect(flag('bar_config')).toEqual({ qux: 'quux' })
        expect(onLogin).toHaveBeenCalled()
      })

      it('should reset the initializing promise on logout', async () => {
        const { client } = setup()
        client.isLogged = true
        client.registerPlugin(flag.plugin)

        const initializing1 = client.plugins.flags.initializing
        const state = util.inspect(initializing1)
        expect(state).toContain('pending')
        await client.plugins.flags.initializing
        const state2 = util.inspect(initializing1)
        expect(state2).not.toContain('pending')
        await client.logout()
        const initializing2 = client.plugins.flags.initializing
        expect(initializing2).not.toBe(initializing1)
        expect(util.inspect(initializing2)).toContain('pending')
      })
    })

    if (typeof document !== 'undefined') {
      it('should initialize from DOM', async () => {
        let div
        try {
          div = document.createElement('div')
          div.dataset.cozy = JSON.stringify({ flags: domFlags })
          document.body.appendChild(div)
          await flag.initialize()
          expect(flag('has_feature1')).toBe(true)
          expect(flag('has_feature2')).toBe(false)
          expect(flag('number_of_foos')).toBe(10)
          expect(flag('bar_config')).toEqual({ qux: 'quux' })
        } finally {
          document.body.removeChild(div)
        }
      })

      it('should initialize from DOM (legacy)', async () => {
        jest.spyOn(console, 'warn').mockImplementation(() => {})
        let div
        try {
          div = document.createElement('div')
          div.dataset.cozyFlags = JSON.stringify(domFlags)
          document.body.appendChild(div)
          await flag.initialize()
          expect(flag('has_feature1')).toBe(true)
          expect(flag('has_feature2')).toBe(false)
          expect(flag('number_of_foos')).toBe(10)
          expect(flag('bar_config')).toEqual({ qux: 'quux' })

          // eslint-disable-next-line no-console
          expect(console.warn).toHaveBeenCalled()
        } finally {
          document.body.removeChild(div)
        }
      })
    }

    it('should initialize from the remote stack', async () => {
      const { client } = setup()
      await flag.initialize(client)
      expect(flag('has_feature1')).toBe(true)
      expect(flag('has_feature2')).toBe(false)
      expect(flag('from_remote')).toBe(true)
      expect(flag('number_of_foos')).toBe(10)
      expect(client.query).toHaveBeenCalledWith({
        doctype: 'io.cozy.settings',
        id: 'io.cozy.settings.flags'
      })
      expect(flag('bar_config')).toEqual({ qux: 'quux' })
    })
  })
}
