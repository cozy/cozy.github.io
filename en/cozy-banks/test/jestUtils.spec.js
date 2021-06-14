import { makeDeprecatedLifecycleMatcher } from './jestUtils'

test('makeDeprecatedLifecycleMatcher', () => {
  const matcher = makeDeprecatedLifecycleMatcher('CustomComponent')
  expect(
    matcher('CustomComponent has been renamed, and is not recommended for use')
  ).toBe(true)
  expect(
    matcher('OtherComponent has been renamed, and is not recommended for use')
  ).toBe(false)
  expect(matcher({})).toBe(false)
})
