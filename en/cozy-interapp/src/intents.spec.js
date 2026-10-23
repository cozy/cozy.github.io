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

  it('should initialise with fetchJSON from client', () => {
    expect(typeof intents.request.fetchJSON).toBe('function')
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
    const onResult = jest.fn()

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
      prom = promIntent.start(element, { onResult })
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

    it('gives the service the data sent before it is ready', () => {
      jest.spyOn(window, 'postMessage')
      prom.sendData({ id: 'otherId' })
      expect(window.postMessage).not.toHaveBeenCalled()

      window.dispatchEvent(mkMessage('ready', {}))
      expect(window.postMessage).toHaveBeenCalledWith(
        { id: 'otherId' },
        serviceOrigin
      )
    })

    describe('after handshake', () => {
      beforeEach(() => {
        jest.spyOn(window, 'postMessage')
        window.dispatchEvent(mkMessage('ready', {}))
      })

      it('sends new data to the service while the intent goes on', () => {
        prom.sendData({ id: 'otherId' })
        expect(window.postMessage).toHaveBeenLastCalledWith(
          { type: `intent-${intent.id}:data`, data: { id: 'otherId' } },
          serviceOrigin
        )
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

      it('handles result messages without ending the intent', async () => {
        window.dispatchEvent(mkMessage('result', { result: { id: '1' } }))
        window.dispatchEvent(mkMessage('result', { result: { id: '2' } }))
        expect(onResult).toHaveBeenNthCalledWith(1, { id: '1' })
        expect(onResult).toHaveBeenNthCalledWith(2, { id: '2' })
        expect(element.querySelector('iframe')).not.toBe(null)

        window.dispatchEvent(mkMessage('done', { document: { id: '3' } }))
        await expect(prom).resolves.toEqual({ id: '3' })
      })

      it('handles exposeFrameRemoval message', async () => {
        window.dispatchEvent(mkMessage('exposeFrameRemoval'))
        const res = await prom
        expect(res.removeIntentIframe).not.toBeUndefined()
        expect(element.querySelector('iframe')).not.toBe(null)
        res.removeIntentIframe()
        expect(element.querySelector('iframe')).toBe(null)
      })

      describe('service', () => {
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

        describe('notifyReadyToUse', () => {
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

        describe('onData', () => {
          // The client and the service share the window of the test: the
          // client of the intent above would take the data for its own
          beforeEach(() => {
            prom.stop()
          })

          const sendData = (data, origin = serviceOrigin) =>
            window.dispatchEvent(
              Object.assign(new Event('message'), {
                data: { type: `intent-${service.getIntent()._id}:data`, data },
                origin,
                source: window
              })
            )

          it('gives the new data of the client, and getData the last ones', () => {
            const listener = jest.fn()
            service.onData(listener)
            sendData({ id: 'otherId' })

            expect(listener).toHaveBeenCalledWith({ id: 'otherId' })
            expect(service.getData()).toEqual({ id: 'otherId' })
          })

          it('ignores the data of another origin', () => {
            const listener = jest.fn()
            service.onData(listener)
            sendData({ id: 'otherId' }, 'https://evil.example')

            expect(listener).not.toHaveBeenCalled()
            expect(service.getData()).toEqual({ id: 'fileId' })
          })

          it('stops giving them once unsubscribed', () => {
            const listener = jest.fn()
            const unsubscribe = service.onData(listener)
            unsubscribe()
            sendData({ id: 'otherId' })

            expect(listener).not.toHaveBeenCalled()
          })
        })

        describe('sendResult', () => {
          it('posts result messages to parent', () => {
            const postSpy = jest.spyOn(window, 'postMessage')
            postSpy.mockClear()
            service.sendResult({ id: '1' })
            service.sendResult({ id: '2' })
            const type = `intent-${service.getIntent()._id}:result`
            const client = service.getIntent().attributes.client
            expect(postSpy).toHaveBeenNthCalledWith(
              1,
              { type, result: { id: '1' } },
              client
            )
            expect(postSpy).toHaveBeenNthCalledWith(
              2,
              { type, result: { id: '2' } },
              client
            )
            postSpy.mockRestore()
          })

          it('throws if called after terminate', () => {
            service.terminate({})
            expect(() => service.sendResult({})).toThrow(
              'Intent service has already been terminated'
            )
          })
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

  describe('service with requireFrameAncestors', () => {
    const client = 'https://chat.example.com'

    const startService = (frameAncestors, ancestorOrigins, options) => {
      api.respond('GET', '/intents/framed-intent-id', {
        data: {
          id: 'framed-intent-id',
          attributes: { client, frameAncestors, services: [] }
        }
      })
      const serviceWindow = {
        document: window.document,
        location: ancestorOrigins === null ? {} : { ancestorOrigins },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        parent: { postMessage: jest.fn() }
      }
      const promise = intents.createService(
        'framed-intent-id',
        serviceWindow,
        options
      )
      return { promise, postMessage: serviceWindow.parent.postMessage }
    }

    const type = subtype => ({ type: `intent-framed-intent-id:${subtype}` })

    it('cancels the intent and rejects when an ancestor is not allowed', async () => {
      const { promise, postMessage } = startService(
        [client],
        [client, 'https://evil.example'],
        { requireFrameAncestors: true }
      )

      await expect(promise).rejects.toThrow(
        'Intent service is framed by a page the intent does not allow'
      )
      expect(postMessage.mock.calls).toEqual([
        [type('ready'), client],
        [type('cancel'), client]
      ])
    })

    it('cancels the intent and rejects without frameAncestors', async () => {
      const { promise, postMessage } = startService(undefined, [client], {
        requireFrameAncestors: true
      })

      await expect(promise).rejects.toThrow(
        'Intent service is framed by a page the intent does not allow'
      )
      expect(postMessage).toHaveBeenLastCalledWith(type('cancel'), client)
    })

    it('starts the handshake when every ancestor is allowed', async () => {
      const { postMessage } = startService([client], [client], {
        requireFrameAncestors: true
      })
      await sleep(1)

      expect(postMessage.mock.calls).toEqual([[type('ready'), client]])
    })

    it('starts the handshake when the browser does not tell the ancestors', async () => {
      const { postMessage } = startService([client], null, {
        requireFrameAncestors: true
      })
      await sleep(1)

      expect(postMessage.mock.calls).toEqual([[type('ready'), client]])
    })

    it('does not check the frame without the option', async () => {
      const { postMessage } = startService(undefined, ['https://evil.example'])
      await sleep(1)

      expect(postMessage.mock.calls).toEqual([[type('ready'), client]])
    })
  })
})
