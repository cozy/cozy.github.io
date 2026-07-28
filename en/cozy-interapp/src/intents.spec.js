import Intents from './intents'
import { mockAPI, sleep } from './testUtils'

describe('Interapp', () => {
  let cozyClient,
    intents,
    api = mockAPI()

  beforeEach(() => {
    api.reset()
  })

  const pickFileIntentNoService = {
    attributes: {
      services: []
    }
  }

  const serviceOrigin = 'http://service-mock'
  const serviceURL = 'http://service-mock/custom-service'

  const pickFileIntent = {
    id: 'pickfile-intent-id',
    meta: {
      _rev: undefined
    },
    attributes: {
      action: 'PICK',
      type: 'io.cozy.files',
      permissions: ['GET'],
      services: [
        {
          slug: 'files',
          href: serviceURL
        }
      ]
    }
  }

  beforeEach(() => {
    cozyClient = {
      stackClient: {
        fetchJSON: jest.fn()
      }
    }
    intents = new Intents({ client: cozyClient })
    cozyClient.stackClient.fetchJSON.mockImplementation(api.fetch)
  })

  it('should initialise with cozy client', () => {
    expect(intents.request.stackClient).toEqual(cozyClient.stackClient)
  })

  describe('creation', () => {
    it('should resolve with created intent', async () => {
      api.respond(
        'POST',
        '/intents',
        {
          data: pickFileIntent
        },
        body => body.data.attributes.action === 'EDIT'
      )
      const intent = await intents.create('EDIT', 'io.cozy.files')
      expect(intent).toBe(pickFileIntent)
    })
  })

  describe('unexisting service', () => {
    it('should reject if no service found', async () => {
      api.respond(
        'POST',
        '/intents',
        {
          data: pickFileIntentNoService
        },
        body => body.data.attributes.action === 'EDIT'
      )
      const element = document.createElement('div')
      expect(
        intents.create('EDIT', 'io.cozy.files').start(element)
      ).rejects.toThrow('Unable to find a service')
    })
  })

  describe('existing service', () => {
    let intent, element, iframe, prom

    const mkMessage = (type, data, _intent = intent) => {
      const ev = new Event('message')
      Object.assign(ev, {
        data: {
          type: `intent-${_intent.id}:${type}`,
          ...data
        },
        origin: serviceOrigin,
        source: window
      })
      return ev
    }

    beforeEach(async () => {
      api.respond(
        'POST',
        '/intents',
        {
          data: pickFileIntent
        },
        body => body.data.attributes.action === 'EDIT'
      )
      element = document.createElement('div')
      const promIntent = intents.create('EDIT', 'io.cozy.files', {
        id: 'fileId'
      })
      intent = await promIntent
      prom = promIntent.start(element, {})
      await sleep(1)
      iframe = element.querySelector('iframe')
      iframe.postMessage = jest.fn()
    })

    afterEach(() => {
      prom.stop()
      jest.restoreAllMocks()
    })

    it('should have created an iframe', () => {
      expect(iframe).not.toBeUndefined()
      expect(iframe.getAttribute('src')).toBe(serviceURL)
      expect(iframe.classList.contains('coz-intent')).toBe(true)
    })

    it('cannot handle message without handshake', async () => {
      window.dispatchEvent(mkMessage('done', { document: 'hello' }))
      expect(prom).rejects.toThrow(
        'Unexpected handshake message from intent service'
      )
    })

    describe('after handshake', () => {
      beforeEach(() => {
        jest.spyOn(window, 'postMessage')
        window.dispatchEvent(mkMessage('ready', {}))
      })

      it('handles ready message', () => {
        expect(window.postMessage).toHaveBeenCalledWith(
          { id: 'fileId' },
          serviceOrigin
        )
      })

      it('handles error message from service', () => {
        window.dispatchEvent(
          mkMessage('error', {
            error: {
              message: 'Error from service',
              type: 'serviceError',
              status: 409
            }
          })
        )
        expect(prom).rejects.toMatchObject({
          message: 'Error from service',
          type: 'serviceError',
          status: 409
        })
      })

      it('handles error message from handling message', async () => {
        jest.spyOn(console, 'warn').mockReturnValue(null)
        const msg = mkMessage('ready', {})
        msg.data.type = 'intent-fakeid:ready'
        window.dispatchEvent(msg)
        await expect(prom).rejects.toThrow('Invalid event id')
      })

      it('handles resize message from service', () => {
        window.dispatchEvent(
          mkMessage('resize', {
            dimensions: {
              height: 100,
              width: 200
            },
            transition: '1s ease height'
          })
        )
        expect(element.style.width).toBe('200px')
        expect(element.style.height).toBe('100px')
        expect(element.style.transition).toBe('1s ease height')
      })

      it('handles success message', async () => {
        window.dispatchEvent(
          mkMessage('done', {
            document: {
              id: '123'
            }
          })
        )
        await expect(prom).resolves.toEqual({ id: '123' })
      })

      it('handles exposeFrameRemoval message', async () => {
        window.dispatchEvent(mkMessage('exposeFrameRemoval'))
        const res = await prom
        expect(res.removeIntentIframe).not.toBeUndefined()
        expect(element.querySelector('iframe')).not.toBe(null)
        res.removeIntentIframe()
        expect(element.querySelector('iframe')).toBe(null)
      })

      describe('notifyReadyToUse', () => {
        let service
        beforeEach(async () => {
          const freshIntent = {
            id: 'readytouse-intent-id',
            meta: { _rev: undefined },
            attributes: {
              action: 'PICK',
              type: 'io.cozy.files',
              permissions: ['GET'],
              client: serviceOrigin,
              services: [{ slug: 'files', href: serviceURL }]
            }
          }
          api.respond('GET', '/intents/readytouse-intent-id', {
            data: freshIntent
          })
          const freshIntents = new Intents({ client: cozyClient })
          const servicePromise = freshIntents.createService(
            freshIntent.id,
            window
          )
          await sleep(1)
          window.dispatchEvent(
            Object.assign(new Event('message'), {
              data: { id: 'fileId' },
              origin: serviceOrigin,
              source: window
            })
          )
          service = await servicePromise
        })

        it('posts readyToUse message to parent', () => {
          const postSpy = jest.spyOn(window, 'postMessage')
          postSpy.mockClear()
          service.notifyReadyToUse()
          expect(postSpy).toHaveBeenCalledWith(
            { type: `intent-${service.getIntent()._id}:readyToUse` },
            service.getIntent().attributes.client
          )
          postSpy.mockRestore()
        })

        it('throws on second call', () => {
          const postSpy = jest.spyOn(window, 'postMessage')
          postSpy.mockClear()
          service.notifyReadyToUse()
          expect(() => service.notifyReadyToUse()).toThrow(
            'Intent service is already ready to use'
          )
          expect(postSpy).toHaveBeenCalledTimes(1)
          postSpy.mockRestore()
        })

        it('throws if called after terminate', () => {
          service.terminate({})
          expect(() => service.notifyReadyToUse()).toThrow(
            'Intent service is terminated'
          )
        })
      })

      it('handles composition', async () => {
        api.respond(
          'POST',
          '/intents',
          {
            data: {
              id: 'composition-intent-id',
              meta: {
                _rev: undefined
              },
              attributes: {
                action: 'INSTALL',
                type: 'io.cozy.apps',
                permissions: ['GET'],
                services: [
                  {
                    slug: 'install-apps',
                    href: 'http://install-apps/index.html'
                  }
                ]
              }
            }
          },
          body => body.data.attributes.action === 'INSTALL'
        )
        window.dispatchEvent(
          mkMessage('compose', {
            action: 'INSTALL',
            data: { slug: 'myapp' },
            doctype: 'io.cozy.apps'
          })
        )

        await sleep(1)

        // Now the iframe from the composed intent has been inserted
        // and the one from the original intent has been hidden
        const iframes = Array.from(element.querySelectorAll('iframe'))
        expect(iframes.length).toBe(2)
        expect(iframe.style.display).toBe('none')
        expect(iframes[1].style.display).not.toBe('none')

        // Finish the composed intent
        const mkCompositionMessage = (type, data) => {
          const msg = mkMessage(type, data, { id: 'composition-intent-id' })
          msg.origin = 'http://install-apps'
          return msg
        }

        window.dispatchEvent(mkCompositionMessage('ready', {}))
        window.dispatchEvent(
          mkCompositionMessage('done', {
            document: { slug: 'io.cozy.apps/myapp' }
          })
        )

        await sleep(1)

        // Original iframe is shown
        expect(iframe.style.display).not.toBe('none')
        const iframes2 = Array.from(element.querySelectorAll('iframe'))

        // No more composed intent iframe
        expect(iframes2.length).toBe(1)
      })
    })
  })
})
