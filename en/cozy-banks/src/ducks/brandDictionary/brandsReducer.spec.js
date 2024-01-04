import { Registry } from 'cozy-client'
import CozyClient from 'cozy-client'
import { makeBrands } from './brandsReducer'
import { act } from '@testing-library/react'

jest.mock('cozy-client', () => ({
  ...jest.requireActual('cozy-client'),
  __esModule: true,
  Registry: jest.fn().mockReturnValue({
    fetchApps: jest.fn()
  })
}))

describe('makeBrands', () => {
  const mockRegistry = new Registry()
  mockRegistry.fetchApps.mockResolvedValue([
    {
      slug: 'alan',
      latest_version: {
        manifest: {
          name: 'Alan',
          banksTransactionRegExp: '\\balan\\b'
        }
      }
    },
    {
      slug: 'ameli',
      maintenance_activated: true,
      latest_version: {
        manifest: {
          name: 'Ameli',
          banksTransactionRegExp: '\\bameli\\b'
        }
      }
    },
    {
      slug: 'fnac'
    }
  ])
  const mockClient = new CozyClient({
    stackClient: {
      collection: jest
        .fn()
        .mockReturnValue({ find: jest.fn().mockReturnValue({ data: [] }) }),
      on: jest.fn(),
      fetchJSON: jest.fn()
    }
  })
  describe('target browser', () => {
    it('Should make brands with just necessary informations and dispatch', async () => {
      const mockDispatch = jest.fn()
      const brands = await makeBrands(mockClient, mockDispatch)

      act(() => {
        expect(brands).toBeUndefined()
        expect(mockDispatch).toBeCalledWith({
          brands: [
            {
              contact: [
                {
                  action: 'sendCareSheet',
                  href: 'https://alan.eu/login',
                  type: 'web'
                },
                {
                  href: 'https://alan.eu/open-or-download-mobile-app?origin=alanweb_landing_footer&os=android',
                  platform: 'android',
                  type: 'app'
                },
                {
                  href: 'https://alan.eu/open-or-download-mobile-app?origin=alanweb_landing_footer&os=ios',
                  platform: 'ios',
                  type: 'app'
                }
              ],
              hasTrigger: false,
              health: true,
              konnectorSlug: 'alan',
              maintenance: false,
              name: 'Alan',
              regexp: '\\balan\\b'
            },
            {
              contact: [
                { number: '36 46', price: '0,06 €/min', type: 'phone' },
                {
                  action: 'sendCareSheet',
                  href: 'https://www.ameli.fr/assure/adresses-et-contacts',
                  type: 'web'
                }
              ],
              hasTrigger: false,
              health: true,
              konnectorSlug: 'ameli',
              maintenance: true,
              name: 'Ameli',
              regexp: '\\bameli\\b'
            }
          ],
          type: 'FETCH_BRANDS'
        })
      })
    })
  })
  describe('target service', () => {
    it('Should make brands with just necessary informations and dispatch', async () => {
      const brands = await makeBrands(mockClient, undefined, true)
      act(() => {
        expect(brands).toEqual([
          {
            contact: [
              {
                action: 'sendCareSheet',
                href: 'https://alan.eu/login',
                type: 'web'
              },
              {
                href: 'https://alan.eu/open-or-download-mobile-app?origin=alanweb_landing_footer&os=android',
                platform: 'android',
                type: 'app'
              },
              {
                href: 'https://alan.eu/open-or-download-mobile-app?origin=alanweb_landing_footer&os=ios',
                platform: 'ios',
                type: 'app'
              }
            ],
            hasTrigger: false,
            health: true,
            konnectorSlug: 'alan',
            maintenance: false,
            name: 'Alan',
            regexp: '\\balan\\b'
          },
          {
            contact: [
              { number: '36 46', price: '0,06 €/min', type: 'phone' },
              {
                action: 'sendCareSheet',
                href: 'https://www.ameli.fr/assure/adresses-et-contacts',
                type: 'web'
              }
            ],
            hasTrigger: false,
            health: true,
            konnectorSlug: 'ameli',
            maintenance: true,
            name: 'Ameli',
            regexp: '\\bameli\\b'
          }
        ])
      })
    })
  })
})
