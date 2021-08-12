import orderBy from 'lodash/orderBy'

export const getTransactionDate = x => x.date

export const isSearchSufficient = searchStr => searchStr.length > 2

export const byRoundedScore = result => parseFloat(result.score.toFixed(1), 10)
export const byDate = result => result.item.date

export const orderSearchResults = results => {
  return orderBy(results, [byRoundedScore, byDate], ['asc', 'desc'])
}
