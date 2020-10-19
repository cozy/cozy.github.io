import React, { useState } from 'react'
import cx from 'classnames'
import { createSelector } from 'reselect'
import minBy from 'lodash/minBy'
import { useSelector } from 'react-redux'

import { useQuery } from 'cozy-client'
import { useI18n, Empty } from 'cozy-ui/transpiled/react'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import { useTrackPage } from 'ducks/tracking/browser'

import { Media, Bd, Img } from 'cozy-ui/transpiled/react/Media'
import NarrowContent from 'cozy-ui/transpiled/react/NarrowContent'

import { transactionsConn } from 'doctypes'
import { TransactionList } from 'ducks/transactions/Transactions'
import BarTheme from 'ducks/bar/BarTheme'
import TransactionTableHead from 'ducks/transactions/header/TableHead'
import { getTransactions } from 'selectors'

import Header from 'components/Header'
import Padded from 'components/Spacing/Padded'
import { PageTitle } from 'components/Title'
import BackButton from 'components/BackButton'
import { BarCenter, BarSearch } from 'components/Bar'
import { useParams } from 'components/RouterContext'
import { Typography } from '@material-ui/core'

import BarSearchInput from 'components/BarSearchInput'

import searchIllu from 'assets/search-illu.svg'

const makeSearch = searchStr => op => {
  return op.label.toLowerCase().includes(searchStr.toLowerCase())
}

const isSearchSufficient = searchStr => searchStr.length > 2

const Ul = props => {
  return <ul {...props} className={cx('u-pl-1 u-mt-1', props.className)} />
}

const Li = props => {
  return (
    <li
      {...props}
      className={cx('u-h-2 u-flex-justify-center', props.className)}
    />
  )
}

const SearchSuggestions = () => {
  const { t } = useI18n()
  const suggestions = t('Search.suggestions').split(', ')
  return (
    <Typography component={Ul} color="textSecondary">
      {suggestions.map((suggestion, i) => (
        <Li key={i}>
          <Typography color="textSecondary">{suggestion}</Typography>
        </Li>
      ))}
    </Typography>
  )
}

const getTransactionEarliestDate = createSelector(
  [getTransactions],
  transactions => minBy(transactions, x => x.date)
)

const EarliestTransactionDate = () => {
  const { t, f } = useI18n()
  const transaction = useSelector(getTransactionEarliestDate)
  return transaction ? (
    <div className="u-mt-half">
      {t('Search.since', { date: f(transaction.date, 'DD MMM YYYY') })}
    </div>
  ) : null
}

const CompositeHeader = ({ title, image }) => {
  return (
    <div className="u-ta-center">
      {image}
      <Typography
        variant="h5"
        color="textSecondary"
        classes={{ root: 'u-mb-1-half' }}
      >
        {title}
      </Typography>
    </div>
  )
}

const SearchPage = () => {
  const params = useParams()
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()

  const [search, setSearch] = useState(params.search || '')
  const handleChange = ev => {
    setSearch(ev.target.value)
  }

  useTrackPage('recherche')

  let { data: allTransactions } = useQuery(
    transactionsConn.query,
    transactionsConn
  )

  let transactions = allTransactions || []
  const searchSufficient = isSearchSufficient(search)
  if (searchSufficient) {
    transactions = transactions.filter(makeSearch(search))
  }

  return (
    <div>
      <BarTheme theme="primary" />
      <Header theme="inverted" fixed>
        {isMobile ? (
          <>
            <BackButton to="/balances" arrow={true} />
            <BarCenter>
              <BarSearchInput
                placeholder={t('Search.input-placeholder')}
                type="text"
                value={search}
                onChange={handleChange}
                autofocus
              />
            </BarCenter>
          </>
        ) : (
          <Padded>
            <Media>
              <Img>
                <BackButton to="/balances" arrow={true} />
              </Img>
              <Bd>
                <PageTitle className="u-lh-tiny">
                  {searchSufficient && transactions.length
                    ? t('Search.title-results', {
                        smart_count: transactions.length
                      })
                    : t('Search.title')}
                </PageTitle>
                <EarliestTransactionDate />
              </Bd>
            </Media>
            <BarSearch>
              <BarSearchInput
                placeholder={t('Search.input-placeholder')}
                value={search}
                onChange={handleChange}
              />
            </BarSearch>
          </Padded>
        )}
        <TransactionTableHead isSubcategory={false} />
      </Header>
      {!searchSufficient ? (
        <Padded>
          <NarrowContent>
            <CompositeHeader
              image={
                <img src={searchIllu} width="116px" className="u-mt-1 u-mb-1" />
              }
              title={t('Search.type-a-search')}
            />
            <SearchSuggestions />
          </NarrowContent>
        </Padded>
      ) : null}
      <div className={`js-scrolling-element`}>
        {searchSufficient ? (
          transactions.length > 0 ? (
            <TransactionList transactions={transactions} />
          ) : (
            <Empty
              className="u-mt-large"
              title={t('Search.no-transactions-found', { search })}
              icon={''}
            />
          )
        ) : null}
      </div>
    </div>
  )
}

export default SearchPage
