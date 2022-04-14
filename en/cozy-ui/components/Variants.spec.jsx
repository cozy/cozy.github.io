import {
  makeAllPossibleVariants,
  makeRadioAllPossibleVariants
} from './Variants'

describe('makeAllPossibleVariants', () => {
  it('should return correct values', () => {
    expect(makeAllPossibleVariants([{ foo: true }])).toStrictEqual([
      { foo: true },
      { foo: false }
    ])

    expect(makeAllPossibleVariants([{ foo: true, bar: false }])).toStrictEqual([
      { foo: true, bar: true },
      { foo: true, bar: false },
      { foo: false, bar: true },
      { foo: false, bar: false }
    ])
  })
})

describe('makeRadioAllPossibleVariants', () => {
  it('should return correct values', () => {
    expect(makeRadioAllPossibleVariants([{ foo: true }])).toStrictEqual([
      { foo: true }
    ])

    expect(
      makeRadioAllPossibleVariants([{ foo: true, bar: false }])
    ).toStrictEqual([{ foo: true, bar: false }, { foo: false, bar: true }])

    expect(
      makeRadioAllPossibleVariants([{ foo: true, bar: false, foo2: false }])
    ).toStrictEqual([
      { foo: true, bar: false, foo2: false },
      { foo: false, bar: true, foo2: false },
      { foo: false, bar: false, foo2: true }
    ])
  })
})
