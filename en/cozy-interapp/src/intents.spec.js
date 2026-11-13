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

    it('takes null data as no data', async () => {
      api.respond('POST', '/intents', { data: pickFileIntent }, body =>
        ['EDIT', 'REDIRECT'].includes(body.data.attributes.action)
      )
      await expect(intents.create('EDIT', 'io.cozy.files', null)).resolves.toBe(
        pickFileIntent
      )
      await expect(
        intents.getRedirectionURL('io.cozy.files', null)
      ).resolves.toBe(serviceURL)
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

    const mkMessage = (
      type,
      data,
      _intent = intent,
      source = iframe.contentWindow
    ) => {
      const ev = new Event('message')
      Object.assign(ev, {
        data: {
          type: `intent-${_intent.id}:${type}`,
          ...data
        },
        origin: serviceOrigin,
        source
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
      document.body.appendChild(element)
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
      element.remove()
      jest.restoreAllMocks()
    })

    it('should have created an iframe', () => {
      expect(iframe).not.toBeUndefined()
      expect(iframe.getAttribute('src')).toBe(serviceURL)
      expect(iframe.classList.contains('coz-intent')).toBe(true)
      expect(iframe.getAttribute('allow')).toBe('clipboard-write')
      expect(iframe.hasAttribute('title')).toBe(false)
    })

    it('opens nothing when stopped before the intent is created', async () => {
      prom.stop()
      iframe.remove()
      const stopped = intents.create('EDIT', 'io.cozy.files').start(element)
      stopped.stop()
      await sleep(1)
      expect(element.querySelector('iframe')).toBe(null)
    })

    it('lets the client resize', async () => {
      prom.stop()
      const onResize = jest.fn()
      prom = intents
        .create('EDIT', 'io.cozy.files')
        .start(element, { onResize })
      await sleep(1)
      iframe = element.querySelector('iframe')
      window.dispatchEvent(mkMessage('ready', {}))
      window.dispatchEvent(
        mkMessage('resize', {
          dimensions: { height: 100 },
          transition: '1s ease height'
        })
      )
      expect(onResize).toHaveBeenCalledWith({
        dimensions: { height: 100 },
        transition: '1s ease height'
      })
      expect(element.style.height).toBe('')
    })

    it('gives the client the sizes of a resize only', async () => {
      prom.stop()
      const onResize = jest.fn()
      prom = intents
        .create('EDIT', 'io.cozy.files')
        .start(element, { onResize })
      await sleep(1)
      iframe = element.querySelector('iframe')
      window.dispatchEvent(mkMessage('ready', {}))
      window.dispatchEvent(
        mkMessage('resize', {
          dimensions: { height: '100px', position: 'fixed', top: 0 },
          transition: 42
        })
      )
      expect(onResize).toHaveBeenCalledWith({ dimensions: { height: 100 } })
    })

    it('frames the service picked by filteredServices', async () => {
      prom.stop()
      api.reset()
      api.respond('POST', '/intents', {
        data: {
          ...pickFileIntent,
          attributes: {
            ...pickFileIntent.attributes,
            services: [
              { slug: 'files', href: serviceURL },
              { slug: 'photos', href: 'http://photos-mock/service' }
            ]
          }
        }
      })
      prom = intents
        .create('EDIT', 'io.cozy.files', {
          filteredServices: service => service.slug === 'photos'
        })
        .start(element)
      await sleep(1)
      expect(
        element.querySelector('iframe:last-child').getAttribute('src')
      ).toBe('http://photos-mock/service')
    })

    it('keeps the filter for each start of the intent', async () => {
      prom.stop()
      api.reset()
      api.respond('POST', '/intents', {
        data: {
          ...pickFileIntent,
          attributes: {
            ...pickFileIntent.attributes,
            services: [
              { slug: 'files', href: serviceURL },
              { slug: 'photos', href: 'http://photos-mock/service' }
            ]
          }
        }
      })
      const data = { filteredServices: service => service.slug === 'photos' }
      const created = intents.create('EDIT', 'io.cozy.files', data)
      created.start(element).stop()
      await sleep(1)
      prom = created.start(element)
      await sleep(1)
      expect(element.querySelector('iframe').getAttribute('src')).toBe(
        'http://photos-mock/service'
      )
      expect(data.filteredServices).toBeDefined()
    })

    it('focuses the iframe it inserts', () => {
      expect(document.activeElement).toBe(iframe)
    })

    it('leaves the focus where it is with focus: false', async () => {
      prom.stop()
      const button = document.createElement('button')
      document.body.appendChild(button)
      button.focus()
      prom = intents
        .create('EDIT', 'io.cozy.files')
        .start(element, { focus: false })
      await sleep(1)
      expect(element.querySelector('iframe')).not.toBe(null)
      expect(document.activeElement).toBe(button)
      button.remove()
    })

    describe('with readyTimeout', () => {
      const startWithTimeout = async () => {
        prom.stop()
        jest.useFakeTimers()
        prom = intents
          .create('EDIT', 'io.cozy.files')
          .start(element, { readyTimeout: 1000 })
        await jest.advanceTimersByTimeAsync(0)
        iframe = element.querySelector('iframe')
      }

      afterEach(() => {
        jest.useRealTimers()
      })

      it('fails when the service does not get ready in time', async () => {
        await startWithTimeout()
        const failed = jest.fn()
        prom.catch(failed)
        await jest.advanceTimersByTimeAsync(999)
        expect(failed).not.toHaveBeenCalled()
        await jest.advanceTimersByTimeAsync(1)
        await expect(prom).rejects.toThrow(
          'The intent service did not get ready in time'
        )
        expect(element.querySelector('iframe')).toBe(null)
      })

      it('takes as long as needed once the service is ready', async () => {
        await startWithTimeout()
        window.dispatchEvent(mkMessage('ready', {}))
        await jest.advanceTimersByTimeAsync(5000)
        window.dispatchEvent(mkMessage('done', { document: 'mine' }))
        await expect(prom).resolves.toBe('mine')
      })
    })

    describe('composed intent', () => {
      const composedIntent = {
        id: 'composition-intent-id',
        attributes: {
          action: 'INSTALL',
          type: 'io.cozy.apps',
          services: [{ slug: 'store', href: 'http://install-apps/index.html' }]
        }
      }

      const startAndCompose = async options => {
        prom.stop()
        jest.useFakeTimers()
        prom = intents.create('EDIT', 'io.cozy.files').start(element, options)
        await jest.advanceTimersByTimeAsync(0)
        iframe = element.querySelector('iframe')
        window.dispatchEvent(mkMessage('ready', {}))
        api.respond(
          'POST',
          '/intents',
          { data: composedIntent },
          body => body.data.attributes.action === 'INSTALL'
        )
        // A service has no say on the iframe of the client
        window.dispatchEvent(
          mkMessage('compose', {
            action: 'INSTALL',
            doctype: 'io.cozy.apps',
            data: { className: 'from-service-data' },
            className: 'from-service'
          })
        )
        await jest.advanceTimersByTimeAsync(0)
        return element.querySelectorAll('iframe')[1]
      }

      afterEach(() => {
        jest.useRealTimers()
      })

      it('takes the classes of the client, not of the service', async () => {
        const composed = await startAndCompose({
          className: 'u-w-100 u-bdw-0'
        })
        expect([...composed.classList]).toEqual([
          'coz-intent',
          'u-w-100',
          'u-bdw-0'
        ])
      })

      it('takes the title and the resize handling of the client', async () => {
        const onResize = jest.fn()
        const composed = await startAndCompose({ onResize, title: 'Pick' })
        expect(composed.getAttribute('title')).toBe('Pick')

        const msg = mkMessage(
          'ready',
          {},
          composedIntent,
          composed.contentWindow
        )
        msg.origin = 'http://install-apps'
        window.dispatchEvent(msg)
        const resize = mkMessage(
          'resize',
          { dimensions: { height: 100 } },
          composedIntent,
          composed.contentWindow
        )
        resize.origin = 'http://install-apps'
        window.dispatchEvent(resize)
        expect(onResize).toHaveBeenCalledWith({ dimensions: { height: 100 } })
        expect(element.style.height).toBe('')
      })

      it('fails when the composed service does not get ready in time', async () => {
        await startAndCompose({ readyTimeout: 1000 })
        const failed = jest.fn()
        prom.catch(failed)
        expect(element.querySelectorAll('iframe').length).toBe(2)
        await jest.advanceTimersByTimeAsync(1000)
        expect(failed).toHaveBeenCalled()
        await expect(prom).rejects.toThrow(
          'The intent service did not get ready in time'
        )
        expect(element.querySelector('iframe')).toBe(null)
      })
    })

    describe('in the window of an overlay of the app', () => {
      // A page of the origin of the app, in another window
      let host, hostWindow, frame

      const startInHost = async () => {
        prom.stop()
        host = document.createElement('iframe')
        document.body.appendChild(host)
        hostWindow = host.contentWindow
        const box = host.contentDocument.body
        prom = intents
          .create('EDIT', 'io.cozy.files', { id: 'fileId' })
          .start(box)
        await sleep(1)
        frame = box.querySelector('iframe')
        jest.spyOn(frame.contentWindow, 'postMessage')
      }

      const hostMessage = (type, data) => {
        const ev = new hostWindow.Event('message')
        Object.assign(ev, {
          data: { type: `intent-${intent.id}:${type}`, ...data },
          origin: serviceOrigin,
          source: frame.contentWindow
        })
        hostWindow.dispatchEvent(ev)
      }

      afterEach(() => {
        host.remove()
      })

      it('listens on that window', async () => {
        await startInHost()
        const removeListener = jest.spyOn(hostWindow, 'removeEventListener')
        hostMessage('ready', {})
        expect(frame.contentWindow.postMessage).toHaveBeenCalledWith(
          { id: 'fileId' },
          serviceOrigin
        )
        hostMessage('done', { document: 'mine' })
        await expect(prom).resolves.toBe('mine')
        expect(removeListener).toHaveBeenCalledWith(
          'message',
          expect.any(Function)
        )
      })

      it('reads the error of the service from that window', async () => {
        await startInHost()
        hostMessage('ready', {})
        hostMessage('error', {
          error: { message: 'Error from service', status: 409 }
        })
        await expect(prom).rejects.toMatchObject({
          message: 'Error from service',
          status: 409
        })
      })
    })

    it('gives the iframe the classes of the client', async () => {
      prom.stop()
      prom = intents
        .create('EDIT', 'io.cozy.files')
        .start(element, { className: 'u-w-100  u-bdw-0' })
      await sleep(1)
      expect([...element.querySelector('iframe').classList]).toEqual([
        'coz-intent',
        'u-w-100',
        'u-bdw-0'
      ])
    })

    it('titles the iframe', async () => {
      prom.stop()
      prom = intents
        .create('EDIT', 'io.cozy.files')
        .start(element, { title: 'Pick a file' })
      await sleep(1)
      expect(element.querySelector('iframe').getAttribute('title')).toBe(
        'Pick a file'
      )
    })

    it('takes the origin of the service as the browser serializes it', async () => {
      prom.stop()
      api.reset()
      // Host in capitals, default port, userinfo: none of them is in the
      // origin of the messages
      api.respond('POST', '/intents', {
        data: {
          ...pickFileIntent,
          attributes: {
            ...pickFileIntent.attributes,
            services: [
              {
                slug: 'files',
                href: 'http://user:pw@SERVICE-MOCK:80/custom-service'
              }
            ]
          }
        }
      })
      prom = intents
        .create('EDIT', 'io.cozy.files', { id: 'fileId' })
        .start(element)
      await sleep(1)
      iframe = element.querySelector('iframe')
      jest.spyOn(iframe.contentWindow, 'postMessage')
      window.dispatchEvent(mkMessage('ready', {}))
      expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
        { id: 'fileId' },
        serviceOrigin
      )
    })

    it('ignores the messages of another window of the service origin, silently', async () => {
      const warn = jest.spyOn(console, 'warn')
      jest.spyOn(iframe.contentWindow, 'postMessage')
      const other = document.createElement('iframe')
      document.body.appendChild(other)
      window.dispatchEvent(mkMessage('ready', {}, intent, other.contentWindow))
      window.dispatchEvent(
        mkMessage('done', { document: 'forged' }, intent, other.contentWindow)
      )
      const embed = mkMessage('', {}, intent, other.contentWindow)
      embed.data = { type: 'twake-embed:badges' }
      window.dispatchEvent(embed)
      window.dispatchEvent(mkMessage('ready', {}))
      window.dispatchEvent(mkMessage('done', { document: 'mine' }))

      await expect(prom).resolves.toBe('mine')
      expect(iframe.contentWindow.postMessage).toHaveBeenCalledTimes(1)
      expect(warn).not.toHaveBeenCalled()
      other.remove()
    })

    it('takes the cancel of a service page that went away, after the handshake', async () => {
      const other = document.createElement('iframe')
      document.body.appendChild(other)
      const settled = jest.fn()
      prom.then(settled).catch(settled)
      // Before the handshake
      window.dispatchEvent(mkMessage('cancel', {}, intent, null))
      await sleep(1)
      expect(settled).not.toHaveBeenCalled()

      window.dispatchEvent(mkMessage('ready', {}))
      // From a window that still exists
      window.dispatchEvent(mkMessage('cancel', {}, intent, other.contentWindow))
      await sleep(1)
      expect(settled).not.toHaveBeenCalled()
      expect(element.querySelector('iframe')).not.toBe(null)

      // From a page that went away: the browser gives it no source
      window.dispatchEvent(mkMessage('cancel', {}, intent, null))
      await sleep(1)
      expect(settled).toHaveBeenCalledWith(null)
      expect(element.querySelector('iframe')).toBe(null)
      other.remove()
    })

    it('tells the client when the service is ready, once', async () => {
      prom.stop()
      const onServiceReady = jest.fn()
      prom = intents
        .create('EDIT', 'io.cozy.files', { id: 'fileId' })
        .start(element, { onServiceReady })
      await sleep(1)
      iframe = element.querySelector('iframe')

      expect(onServiceReady).not.toHaveBeenCalled()
      window.dispatchEvent(mkMessage('ready', {}))
      window.dispatchEvent(mkMessage('ready', {}))
      expect(onServiceReady).toHaveBeenCalledTimes(1)
    })

    it('ignores what is not an intent message, silently', async () => {
      const warn = jest.spyOn(console, 'warn')
      for (const data of [null, 'hello', { type: 'load' }, { type: 3 }]) {
        const msg = mkMessage('', {})
        msg.data = data
        window.dispatchEvent(msg)
      }
      window.dispatchEvent(mkMessage('ready', {}))
      window.dispatchEvent(mkMessage('done', { document: 'mine' }))

      await expect(prom).resolves.toBe('mine')
      expect(warn).not.toHaveBeenCalled()
    })

    it('runs intents of the same origin side by side', async () => {
      api.respond(
        'POST',
        '/intents',
        { data: { ...pickFileIntent, id: 'second-intent-id' } },
        body => body.data.attributes.action === 'PICK'
      )
      const secondElement = document.createElement('div')
      document.body.appendChild(secondElement)
      const second = intents
        .create('PICK', 'io.cozy.files', { id: 'secondFileId' })
        .start(secondElement)
      await sleep(1)
      const secondFrame = secondElement.querySelector('iframe').contentWindow
      const secondIntent = { id: 'second-intent-id' }
      jest.spyOn(iframe.contentWindow, 'postMessage')
      jest.spyOn(secondFrame, 'postMessage')

      window.dispatchEvent(mkMessage('ready', {}, secondIntent, secondFrame))
      window.dispatchEvent(mkMessage('ready', {}))
      expect(secondFrame.postMessage).toHaveBeenCalledWith(
        { id: 'secondFileId' },
        serviceOrigin
      )
      expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
        { id: 'fileId' },
        serviceOrigin
      )

      window.dispatchEvent(
        mkMessage('done', { document: 'second' }, secondIntent, secondFrame)
      )
      window.dispatchEvent(mkMessage('done', { document: 'first' }))
      await expect(second).resolves.toBe('second')
      await expect(prom).resolves.toBe('first')
      secondElement.remove()
    })

    it('cannot handle message without handshake', async () => {
      window.dispatchEvent(mkMessage('done', { document: 'hello' }))
      expect(prom).rejects.toThrow(
        'Unexpected handshake message from intent service'
      )
    })

    it.each([[['a', 'b']], [new Date(0)]])(
      'gives the service data that are not an object as they are: %p',
      async data => {
        prom.stop()
        prom = intents.create('EDIT', 'io.cozy.files', data).start(element)
        await sleep(1)
        iframe = element.querySelector('iframe')
        jest.spyOn(iframe.contentWindow, 'postMessage')
        window.dispatchEvent(mkMessage('ready', {}))
        expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
          data,
          serviceOrigin
        )
      }
    )

    it('gives the service the data sent before it is ready', () => {
      jest.spyOn(iframe.contentWindow, 'postMessage')
      prom.sendData({ id: 'otherId' })
      expect(iframe.contentWindow.postMessage).not.toHaveBeenCalled()

      window.dispatchEvent(mkMessage('ready', {}))
      expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
        { id: 'otherId' },
        serviceOrigin
      )
    })

    describe('after handshake', () => {
      beforeEach(() => {
        jest.spyOn(iframe.contentWindow, 'postMessage')
        window.dispatchEvent(mkMessage('ready', {}))
      })

      it('sends new data to the service while the intent goes on', () => {
        prom.sendData({ id: 'otherId' })
        expect(iframe.contentWindow.postMessage).toHaveBeenLastCalledWith(
          { type: `intent-${intent.id}:data`, data: { id: 'otherId' } },
          serviceOrigin
        )
      })

      it('handles ready message', () => {
        expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
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

      it('does not give the data again to a service frame that loads again', () => {
        window.dispatchEvent(mkMessage('ready', {}))
        expect(iframe.contentWindow.postMessage).toHaveBeenCalledTimes(1)
      })

      it('ignores the messages of another intent, silently', async () => {
        const warn = jest.spyOn(console, 'warn')
        window.dispatchEvent(
          mkMessage('done', { document: 'other' }, { id: 'other-intent-id' })
        )
        window.dispatchEvent(mkMessage('done', { document: 'mine' }))
        await expect(prom).resolves.toBe('mine')
        expect(warn).not.toHaveBeenCalled()
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

      it('takes the sizes of a resize message only, as pixels', () => {
        window.dispatchEvent(
          mkMessage('resize', {
            dimensions: {
              height: '150px',
              width: -1,
              maxHeight: 20000,
              position: 'fixed',
              zIndex: 2147483647,
              cssText: 'position: fixed'
            }
          })
        )
        expect(element.style.height).toBe('150px')
        expect(element.style.width).toBe('')
        expect(element.style.maxHeight).toBe('')
        expect(element.style.position).toBe('')
        expect(element.style.zIndex).toBe('')
        expect(element.style.transition).toBe('')
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

      it('stops listening to the service at exposeFrameRemoval, before the iframe goes', async () => {
        const removeListener = jest.spyOn(window, 'removeEventListener')
        window.dispatchEvent(
          mkMessage('exposeFrameRemoval', { document: 'mine' })
        )
        const res = await prom
        expect(res.document).toBe('mine')
        expect(removeListener).toHaveBeenCalledWith(
          'message',
          expect.any(Function)
        )
        window.dispatchEvent(
          mkMessage('resize', { dimensions: { height: 100 } })
        )
        expect(element.style.height).toBe('')
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

      it('fails when the composed intent cannot start', async () => {
        api.respond(
          'POST',
          '/intents',
          {
            data: {
              id: 'composition-intent-id',
              attributes: {
                action: 'INSTALL',
                type: 'io.cozy.apps',
                services: [{ slug: 'store', href: 'javascript:alert(1)' }]
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

        await expect(prom).rejects.toThrow('The service is not a web page')
        expect(element.querySelector('iframe')).toBe(null)
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
          const msg = mkMessage(
            type,
            data,
            { id: 'composition-intent-id' },
            iframes[1].contentWindow
          )
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

  describe('service in its own window', () => {
    const client = 'https://chat.example.com'
    const intentId = 'window-intent-id'

    const mockWindow = search => ({
      document: window.document,
      location: { search },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      parent: { postMessage: jest.fn() }
    })

    const listenerOf = (serviceWindow, type) =>
      serviceWindow.addEventListener.mock.calls.find(
        ([eventType]) => eventType === type
      )[1]

    const startService = async search => {
      api.respond('GET', `/intents/${intentId}`, {
        data: { id: intentId, attributes: { client, services: [] } }
      })
      const serviceWindow = mockWindow(search)
      const promise = intents.createService(
        search ? null : intentId,
        serviceWindow
      )
      promise.catch(() => {})
      await sleep(1)
      serviceWindow.parent.postMessage.mockClear()
      return { serviceWindow, promise }
    }

    const hide = (serviceWindow, persisted) => {
      listenerOf(serviceWindow, 'pagehide')({ persisted })
      return serviceWindow.parent.postMessage.mock.calls
    }

    it('reads the id of the intent in the URL of its page', async () => {
      await startService(`?session_code=abc&intent=${intentId}`)
      expect(cozyClient.stackClient.fetchJSON).toHaveBeenCalledWith(
        'GET',
        `/intents/${intentId}`
      )
    })

    it('cancels the intent when its page goes away', async () => {
      const { serviceWindow } = await startService()
      expect(hide(serviceWindow, false)).toEqual([
        [{ type: `intent-${intentId}:cancel` }, client]
      ])
    })

    it('keeps the intent when its page may come back from the cache', async () => {
      const { serviceWindow } = await startService()
      expect(hide(serviceWindow, true)).toEqual([])
    })

    it('does not cancel an intent already terminated', async () => {
      const { serviceWindow, promise } = await startService()
      listenerOf(serviceWindow, 'message')({ origin: client, data: {} })
      const service = await promise
      service.terminate({})
      serviceWindow.parent.postMessage.mockClear()
      expect(hide(serviceWindow, false)).toEqual([])
    })
  })
})
