import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import minBy from 'lodash/minBy'
import debounce from 'lodash/debounce'
import keyBy from 'lodash/keyBy'
import Fuse from 'fuse.js/dist/fuse.js'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Typography from 'cozy-ui/transpiled/react/Typography'
import Button from 'cozy-ui/transpiled/react/deprecated/Button'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import Empty from 'cozy-ui/transpiled/react/Empty'
import NarrowContent from 'cozy-ui/transpiled/react/deprecated/NarrowContent'
import { useQuery, isQueryLoading } from 'cozy-client'

import { useTrackPage } from 'ducks/tracking/browser'
import {
  TransactionList,
  TransactionsListContext
} from 'ducks/transactions/Transactions'
import BarTheme from 'ducks/bar/BarTheme'
import HeaderLoadingProgress from 'components/HeaderLoadingProgress'
import Padded from 'components/Padded'
import { DESKTOP_SCROLLING_ELEMENT_CLASSNAME } from 'ducks/transactions/scroll/getScrollingElement'
import {
  getTransactionDate,
  isSearchSufficient,
  orderSearchResults
} from 'ducks/search/helpers'
import { searchConn } from 'ducks/search/queries'
import EarliestTransactionDate from 'ducks/search/EarliestTransactionDate'
import CompositeHeader from 'ducks/search/CompositeHeader'
import SearchSuggestions from 'ducks/search/SearchSuggestions'
import SearchHeader from 'ducks/search/SearchHeader'

import searchIllu from 'assets/search-illu.svg'

const emptyResults = []
const transactionListOptions = { mobileSectionDateFormat: 'ddd D MMMM YYYY' }
const emptyButtonStyle = { maxWidth: '80%' }

const SearchPage = () => {
  const params = useParams()
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()

  const [search, setSearch] = useState(
    params.search ? decodeURIComponent(params.search) : ''
  )
  const [resultIds, setResultIds] = useState([])

  useTrackPage('recherche')

  const transactionCol = useQuery(searchConn.query, searchConn)

  const { data: transactions = emptyResults, lastUpdate } = transactionCol

  const earliestTransaction = useMemo(() => {
    return minBy(transactions, getTransactionDate)
  }, [transactions])

  const fuse = useMemo(() => {
    const fuse = new Fuse(transactions || [], {
      keys: ['label'],
      ignoreLocation: true,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 3
    })
    return fuse
  }, [lastUpdate]) // eslint-disable-line react-hooks/exhaustive-deps

  const searchSufficient = isSearchSufficient(search)

  const performSearch = useMemo(() => {
    return debounce(searchValue => {
      const results = fuse
        .search(searchValue)
        .filter(result => result.score < 0.3)
      const orderedResults = orderSearchResults(results)
      const transactions = orderedResults.map(result => result.item)
      setResultIds(transactions.map(tr => tr._id))
    }, 200)
  }, [fuse, setResultIds])

  const handleFetchMore = useCallback(() => {
    if (!isQueryLoading(transactionCol)) {
      transactionCol.fetchMore()
    }
  }, [transactionCol])

  // at mount time, perform a search if there is the search params
  useEffect(() => {
    if (params.search) {
      performSearch(params.search)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (lastUpdate && search) {
      performSearch(search)
    }
  }, [lastUpdate, performSearch, search])

  const results = useMemo(() => {
    const transactionsById = keyBy(transactions, tr => tr._id)
    return resultIds.map(rid => transactionsById[rid]).filter(Boolean)
  }, [transactions, resultIds])

  return (
    <div>
      <BarTheme theme="primary" />
      <SearchHeader
        results={results}
        search={search}
        setSearch={setSearch}
        searchSufficient={searchSufficient}
        handleFetchMore={handleFetchMore}
        transactionCol={transactionCol}
        earliestTransaction={earliestTransaction}
      />
      <HeaderLoadingProgress
        isFetching={transactionCol.fetchStatus === 'loading'}
      />
      {isMobile && (
        <Typography color="textSecondary" className="u-p-1">
          <EarliestTransactionDate
            onFetchMore={handleFetchMore}
            transaction={earliestTransaction}
            transactionCol={transactionCol}
          />
        </Typography>
      )}
      {(!searchSufficient || !lastUpdate) && (
        <Padded>
          <NarrowContent className="u-m-auto">
            <CompositeHeader
              image={
                <img src={searchIllu} width="116px" className="u-mt-1 u-mb-1" />
              }
              title={t('Search.type-a-search')}
            />
            <SearchSuggestions />
          </NarrowContent>
        </Padded>
      )}
      <div className={DESKTOP_SCROLLING_ELEMENT_CLASSNAME}>
        {searchSufficient &&
          lastUpdate &&
          (results.length > 0 ? (
            <TransactionsListContext.Provider value={transactionListOptions}>
              <TransactionList
                transactions={results}
                showTriggerErrors={false}
              />
            </TransactionsListContext.Provider>
          ) : (
            <Empty
              className="u-mt-large"
              title={t('Search.no-transactions-found', { search })}
            >
              <Button
                style={emptyButtonStyle}
                theme="secondary"
                label={t('Search.search-older-transactions')}
                onClick={handleFetchMore}
              />
            </Empty>
          ))}
      </div>
    </div>
  )
}

export default SearchPage
