import React, { Component } from 'react'
import { connect } from 'react-redux'
import { transactionsConn, GROUP_DOCTYPE } from 'doctypes'
import sumBy from 'lodash/sumBy'
import compose from 'lodash/flowRight'
import cx from 'classnames'

import { queryConnect, isQueryLoading, hasQueryBeenLoaded } from 'cozy-client'
import { translate, useI18n } from 'cozy-ui/transpiled/react/I18n'
import Figure from 'cozy-ui/transpiled/react/Figure'
import Divider from 'cozy-ui/transpiled/react/MuiCozyTheme/Divider'

import { TransactionList } from 'ducks/transactions/Transactions'
import Padded from 'components/Padded'
import styles from 'ducks/reimbursements/Reimbursements.styl'
import Loading from 'components/Loading'
import { KonnectorChip } from 'components/KonnectorChip'
import StoreLink from 'components/StoreLink'
import { Section, SectionTitle } from 'components/Section'
import withFilters from 'components/withFilters'
import { getYear } from 'date-fns'
import TransactionActionsProvider from 'ducks/transactions/TransactionActionsProvider'
import withBrands from 'ducks/brandDictionary/withBrands'
import { getGroupedFilteredExpenses } from './selectors'
import { getPeriod, parsePeriod, getFilteringDoc } from 'ducks/filters'
import { getCategoryName } from 'ducks/categories/categoriesMap'
import { DESKTOP_SCROLLING_ELEMENT_CLASSNAME } from 'ducks/transactions/scroll/getScrollingElement'

const Caption = props => {
  const { className, ...rest } = props

  return <p className={cx(styles.Caption, className)} {...rest} />
}

const NoPendingReimbursements = ({ period, doc }) => {
  const { t } = useI18n()

  const categoryName = doc.categoryId ? getCategoryName(doc.categoryId) : null
  const message = categoryName
    ? t(`Reimbursements.noPending.${categoryName}`, { period })
    : t('Reimbursements.noPending.generic', { period })

  return (
    <Padded className="u-pv-0">
      <Caption>{message}</Caption>
    </Padded>
  )
}

const NoReimbursedExpenses = ({ hasHealthBrands, doc }) => {
  const { t } = useI18n()

  const categoryName = doc.categoryId ? getCategoryName(doc.categoryId) : null

  let message
  if (doc._type === GROUP_DOCTYPE) {
    message = t('Reimbursements.noReimbursed.group')
  } else if (categoryName) {
    message = t(`Reimbursements.noReimbursed.${categoryName}`)
  } else {
    message = t('Reimbursements.noReimbursed.generic')
  }

  return (
    <Padded className="u-pv-0">
      <Caption>{message}</Caption>
      {!hasHealthBrands && categoryName === 'healthExpenses' && (
        <StoreLink type="konnector" category="insurance">
          <KonnectorChip konnectorType="health" />
        </StoreLink>
      )}
    </Padded>
  )
}

export class DumbReimbursements extends Component {
  componentDidMount() {
    this.props.addFilterByPeriod(getYear(new Date()).toString())
  }

  render() {
    const {
      groupedExpenses,
      t,
      f,
      triggers,
      transactions,
      brands,
      currentPeriod,
      filteringDoc
    } = this.props

    if (
      (isQueryLoading(transactions) && !hasQueryBeenLoaded(transactions)) ||
      (isQueryLoading(triggers) && !hasQueryBeenLoaded(triggers))
    ) {
      return <Loading loadingType />
    }

    const {
      reimbursed: reimbursedExpenses,
      pending: pendingExpenses
    } = groupedExpenses

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
}

function mapStateToProps(state) {
  return {
    groupedExpenses: getGroupedFilteredExpenses(state),
    currentPeriod: getPeriod(state),
    filteringDoc: getFilteringDoc(state)
  }
}

const Reimbursements = compose(
  translate(),
  queryConnect({
    transactions: transactionsConn
  }),
  connect(mapStateToProps),
  withFilters,
  // We need to have a different query name otherwise we end with an infinite
  // loading
  withBrands({ queryName: 'reimbursementsPageTriggers' })
)(DumbReimbursements)

export default Reimbursements
