import React, { useState } from 'react'
import { withRouter } from 'react-router-dom'

import { useQuery } from 'cozy-client'
import { Input, Stack, useI18n, Empty } from 'cozy-ui/transpiled/react'

import { transactionsConn } from 'doctypes'
import { TransactionList } from 'ducks/transactions/Transactions'
import BarTheme from 'ducks/bar/BarTheme'
import TransactionTableHead from 'ducks/transactions/header/TableHead'

import Header from 'components/Header'
import Padded from 'components/Spacing/Padded'
import { PageTitle } from 'components/Title'
import BackButton from 'components/BackButton'

const makeSearch = searchStr => op => {
  return op.label.toLowerCase().includes(searchStr.toLowerCase())
}

const isSearchSufficient = searchStr => searchStr.length > 3

const SearchPage = ({ router }) => {
  const { t } = useI18n()
  const [search, setSearch] = useState(router.params.search || '')
  const handleChange = ev => {
    setSearch(ev.target.value)
  }

  let { data: transactions } = useQuery(
    transactionsConn.query,
    transactionsConn
  )

  transactions = transactions || []

  const searchSufficient = isSearchSufficient(search)
  if (searchSufficient) {
    transactions = transactions.filter(makeSearch(search))
  }

  return (
    <div>
      <BarTheme theme="primary" />
      <Header theme="inverted" fixed>
        <Padded>
          <Stack spacing="l">
            <div>
              <BackButton to="/balances" arrow={true} />
              <PageTitle className="u-lh-tiny">{t('Search.title')}</PageTitle>
            </div>
            <Input
              placeholder={t('Search.input-placeholder')}
              type="text"
              value={search}
              onChange={handleChange}
            />
          </Stack>
        </Padded>
        <TransactionTableHead isSubcategory={false} />
      </Header>
      {!searchSufficient ? <Padded>{t('Search.type-a-search')}</Padded> : null}
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

export default withRouter(SearchPage)
