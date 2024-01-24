import React, { useCallback } from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/deprecated/Media'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

import TransactionTableHead from 'ducks/transactions/header/TableHead'
import Header from 'components/Header'
import { PageTitle } from 'components/Title'
import BackButton from 'components/BackButton'
import { BarCenter, BarSearch } from 'components/Bar'
import BarSearchInput from 'components/BarSearchInput'
import Padded from 'components/Padded'
import EarliestTransactionDate from 'ducks/search/EarliestTransactionDate'
import SelectionIconLink from 'ducks/selection/SelectionIconLink'
import { useSelectionContext } from 'ducks/context/SelectionContext'

const SearchHeader = ({
  results,
  search,
  setSearch,
  searchSufficient,
  handleFetchMore,
  transactionCol,
  earliestTransaction
}) => {
  const { isMobile } = useBreakpoints()
  const { t } = useI18n()
  const { isSelectionModeActive, setIsSelectionModeActive } =
    useSelectionContext()

  const handleReset = inputNode => {
    setSearch('')
    setIsSelectionModeActive(false)
    inputNode.focus()
  }

  const handleChange = useCallback(
    ev => {
      setSearch(ev.target.value)
      if (results.length === 0) setIsSelectionModeActive(false)
    },
    [results.length, setIsSelectionModeActive, setSearch]
  )

  return (
    <Header theme="inverted" fixed>
      {isMobile ? (
        <>
          <BackButton to="/balances" arrow={true} />
          <BarCenter>
            <BarSearchInput
              placeholder={t('Search.input-placeholder')}
              value={search}
              autofocus
              onChange={handleChange}
              onReset={handleReset}
            />
            {results.length > 0 && search.length > 0 && (
              <SelectionIconLink
                isSelectionModeActive={isSelectionModeActive}
                setIsSelectionModeActive={setIsSelectionModeActive}
              />
            )}
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
                {searchSufficient && results.length
                  ? t('Search.title-results', {
                      smart_count: results.length
                    })
                  : t('Search.title')}
              </PageTitle>
              <EarliestTransactionDate
                onFetchMore={handleFetchMore}
                transaction={earliestTransaction}
                transactionCol={transactionCol}
              />
            </Bd>
          </Media>
          <BarSearch>
            <BarSearchInput
              placeholder={t('Search.input-placeholder')}
              value={search}
              onChange={handleChange}
              autofocus
              onReset={handleReset}
            />
          </BarSearch>
        </Padded>
      )}
      <TransactionTableHead isSubcategory={false} />
    </Header>
  )
}

export default React.memo(SearchHeader)
