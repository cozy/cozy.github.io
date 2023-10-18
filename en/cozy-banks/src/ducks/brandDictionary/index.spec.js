import {
  getBrands,
  matchBrands,
  findMatchingBrand,
  isMatchingBrand,
  getBrandsWithInstallationInfo,
  getNotInstalledBrands
} from '.'
import brands from './brands'
import getClient from 'selectors/getClient'

jest.mock('selectors/getClient', () => jest.fn())

const getFilteredBrands = () => getBrands(brand => brand.name === 'Filtered')

describe('brandDictionary', () => {
  getClient.mockReturnValue({
    store: {
      getState: () => ({ brands })
    }
  })
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
      expect(
        getBrandsWithInstallationInfo(installedSlugs, brands)
      ).toMatchSnapshot()
    })
  })

  describe('getNotInstalledBrands', () => {
    it('Should return the not installed brands', () => {
      expect(getNotInstalledBrands(installedSlugs, brands)).toMatchSnapshot()
    })
  })
})
