import { getDefaultRedirectionSlug } from './getDefaultRedirectionSlug'

describe('getDefaultRedirectionSlug', () => {
  it.each([
    ['drive/#/folder', 'drive'],
    ['home/', 'home'],
    ['https://alice-drive.example.com/#/folder', null],
    [undefined, null]
  ])('should return the slug of %p', (defaultRedirection, slug) => {
    expect(getDefaultRedirectionSlug(defaultRedirection)).toBe(slug)
  })
})
