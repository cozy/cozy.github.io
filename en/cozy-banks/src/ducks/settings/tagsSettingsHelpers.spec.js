import { filterTags, sortTags } from './tagsSettingsHelpers'

const tags = [
  {
    _id: 0,
    label: 'Achats compulsifs',
    transactions: {
      count: 1
    }
  },
  {
    _id: 1,
    label: 'Boulangerie',
    transactions: {
      count: 136
    }
  },
  {
    _id: 2,
    label: 'Baptême Léo',
    transactions: {
      count: 15
    }
  },
  {
    _id: 3,
    label: 'Chien',
    transactions: {
      count: 19
    }
  }
]

describe('filterTags', () => {
  it.each`
    tags    | filter             | result
    ${tags} | ${''}              | ${tags}
    ${tags} | ${'  '}            | ${tags}
    ${tags} | ${'c'}             | ${[tags[3], tags[0]]}
    ${tags} | ${'C'}             | ${[tags[3], tags[0]]}
    ${tags} | ${' c '}           | ${[tags[3], tags[0]]}
    ${tags} | ${' C '}           | ${[tags[3], tags[0]]}
    ${tags} | ${' ch '}          | ${[tags[3], tags[0]]}
    ${tags} | ${' chiens '}      | ${[tags[3]]}
    ${tags} | ${' c h i e n s '} | ${[tags[3]]}
    ${tags} | ${' leo '}         | ${[tags[2]]}
    ${tags} | ${'abc'}           | ${[]}
  `(
    `should filter the tags when passed arguments: $filter`,
    ({ tags, filter, result }) => {
      expect(filterTags(tags, filter)).toStrictEqual(result)
    }
  )
})

describe('sortTags', () => {
  it.each`
    tags    | sortKey                 | sortOrder | result
    ${tags} | ${'label'}              | ${'asc'}  | ${[tags[0], tags[2], tags[1], tags[3]]}
    ${tags} | ${'label'}              | ${'desc'} | ${[tags[0], tags[2], tags[1], tags[3]].reverse()}
    ${tags} | ${'transactions.count'} | ${'asc'}  | ${[tags[0], tags[2], tags[3], tags[1]]}
    ${tags} | ${'transactions.count'} | ${'desc'} | ${[tags[0], tags[2], tags[3], tags[1]].reverse()}
  `(
    `should sort the tags when passed arguments: $sortKey, $sortOrder`,
    ({ tags, sortKey, sortOrder, result }) => {
      expect(sortTags(tags, sortKey, sortOrder)).toStrictEqual(result)
    }
  )
})
