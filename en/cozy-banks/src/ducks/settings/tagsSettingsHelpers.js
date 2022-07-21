import { remove as removeDiacritics } from 'diacritics'
import Fuse from 'fuse.js'
import orderBy from 'lodash/orderBy'

const whitespace = /\s+/gu

function removeWhitespace(string) {
  return string.replace(whitespace, '')
}

const fuse = new Fuse([], {
  findAllMatches: true,
  threshold: 0.3,
  keys: ['label'],
  getFn: (object, path) => {
    return removeDiacritics(removeWhitespace(Fuse.config.getFn(object, path)))
  }
})

export function filterTags(tags, filter) {
  const trimmedFilter = removeDiacritics(removeWhitespace(filter))
  if (trimmedFilter.length === 0) {
    return Array.from(tags)
  }
  fuse.setCollection(tags)
  return fuse.search(trimmedFilter).map(result => result.item)
}

export function sortTags(tags, sortKey, sortOrder) {
  return orderBy(tags, [sortKey], [sortOrder])
}
