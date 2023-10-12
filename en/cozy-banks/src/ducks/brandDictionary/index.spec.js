import CozyClient from 'cozy-client'
import { Registry } from 'cozy-client'
import {
  getBrands,
  matchBrands,
  findMatchingBrand,
  isMatchingBrand,
  getBrandsWithInstallationInfo,
  getInstalledBrands,
  getNotInstalledBrands,
  makeBrands
} from '.'
import brands from './brands'
import { act } from '@testing-library/react'

jest.mock('cozy-client', () => ({
  ...jest.requireActual('cozy-client'),
  __esModule: true,
  Registry: jest.fn().mockReturnValue({
    fetchApps: jest.fn()
  })
}))

jest.spyOn(JSON, 'parse').mockImplementation(() => brands)

const getFilteredBrands = () => getBrands(brand => brand.name === 'Filtered')

describe('brandDictionary', () => {
  describe('getBrands', () => {
    it('Should return brands', () => {
      expect(getBrands()).toBe(brands)
    })
    it('Should return brands filtered', () => {
      expect(getFilteredBrands()).toEqual([])
    })
  })

  describe('isMatchingBrand', () => {
    const [cpam] = brands.filter(brand => brand.name === 'Ameli')

    it('should return true if the brand and the label match', () => {
      expect(isMatchingBrand(cpam, 'Remboursement CPAM')).toBe(true)
    })

    it("should return false if the brand and the label don't match", () => {
      expect(isMatchingBrand(cpam, 'Pouet pouet')).toBe(false)
    })
  })

  describe('matchBrands', () => {
    it('Should return true if label match with regex', () => {
      expect(matchBrands(getBrands(), 'Cpam Des Yvelines')).toBeTruthy()
      expect(matchBrands(getBrands(), 'C.P.A.M Des Yvelines')).toBeTruthy()
      expect(matchBrands(getBrands(), 'C.P.AaM Des Yvelines')).toBeFalsy()
      expect(
        matchBrands(getBrands(), 'caisse primaire Des Yvelines')
      ).toBeTruthy()
      expect(matchBrands(getBrands(), 'Gandi Paris')).toBeFalsy()
    })

    it('Should return false if brand is filtered', () => {
      expect(matchBrands(getFilteredBrands(), 'Cpam Des Yvelines')).toBeFalsy()
    })
  })

  describe('findMatchingBrand', () => {
    it('Should return brand information if label match with regex', () => {
      expect(findMatchingBrand(getBrands(), 'Gandi Paris')).toBeFalsy()
      expect(
        findMatchingBrand(getBrands(), 'Cpam Des Yvelines').konnectorSlug
      ).toBe('ameli')
      expect(findMatchingBrand(getBrands(), 'Free Telecom').konnectorSlug).toBe(
        'free'
      )
      expect(
        findMatchingBrand(getBrands(), 'Free HautDebit').konnectorSlug
      ).toBe('free')
      expect(findMatchingBrand(getBrands(), 'Free Mobile').konnectorSlug).toBe(
        'freemobile'
      )
    })
  })

  const installedSlugs = ['ameli', 'boulanger', 'mediapart', 'ovh', 'zalando']

  describe('getBrandsWithInstallationInfo', () => {
    it('Should return the list of brands with a isInstalled boolean property', () => {
      expect(getBrandsWithInstallationInfo(installedSlugs)).toMatchSnapshot()
    })
  })

  describe('getInstalledBrands', () => {
    it('Should return the installed brands', () => {
      expect(getInstalledBrands(installedSlugs)).toMatchSnapshot()
    })
  })

  describe('getInstalledBrands', () => {
    it('Should return the not installed brands', () => {
      expect(getNotInstalledBrands(installedSlugs)).toMatchSnapshot()
    })
  })

  describe('makeBrands', () => {
    it('Should make brands with just necessary informations', async () => {
      const localStorageMock = {
        setItem: jest.fn()
      }
      global.localStorage = localStorageMock
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
      await makeBrands(mockClient)

      act(() => {
        expect(localStorage.setItem).toBeCalledWith(
          'brands',
          '[{"name":"Alan","konnectorSlug":"alan","regexp":"\\\\balan\\\\b","health":true,"contact":[{"type":"web","href":"https://alan.eu/login","action":"sendCareSheet"},{"type":"app","platform":"android","href":"https://alan.eu/open-or-download-mobile-app?origin=alanweb_landing_footer&os=android"},{"type":"app","platform":"ios","href":"https://alan.eu/open-or-download-mobile-app?origin=alanweb_landing_footer&os=ios"}],"maintenance":false,"hasTrigger":false},{"name":"Ameli","konnectorSlug":"ameli","regexp":"\\\\bameli\\\\b","health":true,"contact":[{"type":"phone","number":"36 46","price":"0,06 €/min"},{"type":"web","href":"https://www.ameli.fr/assure/adresses-et-contacts","action":"sendCareSheet"}],"maintenance":true,"hasTrigger":false}]'
        )
      })
    })
  })
})
