import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { transactionsConn } from 'doctypes'
import sumBy from 'lodash/sumBy'

import { isQueryLoading, hasQueryBeenLoaded, useQuery } from 'cozy-client'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Figure from 'cozy-ui/transpiled/react/Figure'
import Divider from 'cozy-ui/transpiled/react/Divider'

import { TransactionList } from 'ducks/transactions/Transactions'
import styles from 'ducks/reimbursements/Reimbursements.styl'
import Loading from 'components/Loading'
import { Section, SectionTitle } from 'components/Section'
import { useFilters } from 'components/withFilters'
import { getYear } from 'date-fns'
import TransactionActionsProvider from 'ducks/transactions/TransactionActionsProvider'
import { getGroupedFilteredExpenses } from './selectors'
import { getPeriod, parsePeriod, getFilteringDoc } from 'ducks/filters'
import { DESKTOP_SCROLLING_ELEMENT_CLASSNAME } from 'ducks/transactions/scroll/getScrollingElement'
import NoPendingReimbursements from 'ducks/reimbursements/NoPendingReimbursements'
import NoReimbursedExpenses from 'ducks/reimbursements/NoReimbursedExpenses'
import { getBrands } from 'ducks/brandDictionary'

export const DumbReimbursements = ({
  triggers,
  addFilterByPeriod,
  groupedExpenses,
  currentPeriod,
  filteringDoc,
  transactions,
  brands
}) => {
  const { t, f } = useI18n()

  useEffect(() => {
    addFilterByPeriod(getYear(new Date()).toString())
  }, [addFilterByPeriod])

  if (
    (isQueryLoading(transactions) && !hasQueryBeenLoaded(transactions)) ||
    (isQueryLoading(triggers) && !hasQueryBeenLoaded(triggers))
  ) {
    return <Loading loadingType />
  }

  const { reimbursed: reimbursedExpenses, pending: pendingExpenses } =
    groupedExpenses

  const pendingAmount = sumBy(pendingExpenses, t => -t.amount)

  const hasHealthBrands =
    brands.filter(brand => brand.hasTrigger && brand.health).length > 0

  const formattedPeriod = f(
    parsePeriod(currentPeriod),
    currentPeriod.length === 4 ? 'YYYY' : 'MMMM YYYY'
  )

  const hasPendingExpenses = pendingExpenses && pendingExpenses.length > 0
  const hasReimbursedExpenses =
    reimbursedExpenses && reimbursedExpenses.length > 0

  return (
    <TransactionActionsProvider>
      <div
        className={`${styles.Reimbursements} ${DESKTOP_SCROLLING_ELEMENT_CLASSNAME}`}
      >
        <Section>
          <SectionTitle>
            {t('Reimbursements.pending')}
            <Figure
              symbol="€"
              total={pendingAmount}
              className={styles.Reimbursements__figure}
              signed
            />{' '}
          </SectionTitle>
          {hasPendingExpenses ? (
            <TransactionList
              transactions={pendingExpenses}
              className={styles.Reimbursements__transactionsList}
              showTriggerErrors={false}
            />
          ) : (
            <>
              <Divider />
              <NoPendingReimbursements
                period={formattedPeriod}
                doc={filteringDoc}
              />
            </>
          )}
        </Section>
        <Section>
          <SectionTitle>{t('Reimbursements.alreadyReimbursed')}</SectionTitle>
          {hasReimbursedExpenses ? (
            <TransactionList
              transactions={reimbursedExpenses}
              className={styles.Reimbursements__transactionsList}
              showTriggerErrors={false}
            />
          ) : (
            <>
              <Divider />
              <NoReimbursedExpenses
                hasHealthBrands={hasHealthBrands}
                doc={filteringDoc}
              />
            </>
          )}
        </Section>
      </div>
    </TransactionActionsProvider>
  )
}

const Reimbursements = props => {
  const { addFilterByPeriod } = useFilters()
  const groupedExpenses = useSelector(getGroupedFilteredExpenses)
  const currentPeriod = useSelector(getPeriod)
  const filteringDoc = useSelector(getFilteringDoc)
  const transactions = useQuery(transactionsConn.query, transactionsConn)
  const brands = getBrands()

  return (
    <DumbReimbursements
      addFilterByPeriod={addFilterByPeriod}
      groupedExpenses={groupedExpenses}
      currentPeriod={currentPeriod}
      filteringDoc={filteringDoc}
      transactions={transactions}
      brands={brands}
      {...props}
    />
  )
}

export default Reimbursements
