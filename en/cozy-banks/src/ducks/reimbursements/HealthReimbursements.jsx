import React, { Component } from 'react'
import { connect } from 'react-redux'
import { queryConnect } from 'cozy-client'
import { transactionsConn } from 'doctypes'
import { flowRight as compose, sumBy } from 'lodash'
import cx from 'classnames'
import { TransactionList } from 'ducks/transactions/Transactions'
import { translate } from 'cozy-ui/transpiled/react'
import { Padded } from 'components/Spacing'
import { Figure } from 'components/Figure'
import styles from 'ducks/reimbursements/HealthReimbursements.styl'
import Loading from 'components/Loading'
import { KonnectorChip } from 'components/KonnectorChip'
import { StoreLink } from 'components/StoreLink'
import { Section } from 'components/Section'
import withFilters from 'components/withFilters'
import { getYear } from 'date-fns'
import TransactionActionsProvider from 'ducks/transactions/TransactionActionsProvider'
import withBrands from 'ducks/brandDictionary/withBrands'
import { isCollectionLoading, hasBeenLoaded } from 'ducks/client/utils'
import { getGroupedHealthExpensesByPeriod } from './selectors'
import { getPeriod, parsePeriod } from 'ducks/filters'

const Caption = props => {
  const { className, ...rest } = props

  return <p className={cx(styles.Caption, className)} {...rest} />
}

export class DumbHealthReimbursements extends Component {
  componentDidMount() {
    this.props.addFilterByPeriod(getYear(new Date()).toString())
  }

  render() {
    const {
      groupedHealthExpenses,
      t,
      f,
      triggers,
      transactions,
      brands,
      currentPeriod
    } = this.props

    if (
      (isCollectionLoading(transactions) && !hasBeenLoaded(transactions)) ||
      (isCollectionLoading(triggers) && !hasBeenLoaded(triggers))
    ) {
      return <Loading />
    }

    const {
      reimbursed: reimbursedTransactions,
      pending: pendingTransactions
    } = groupedHealthExpenses

    const pendingAmount = sumBy(pendingTransactions, t => -t.amount)

    const hasHealthBrands =
      brands.filter(brand => brand.hasTrigger && brand.health).length > 0

    const formattedPeriod = f(
      parsePeriod(currentPeriod),
      currentPeriod.length === 4 ? 'YYYY' : 'MMMM YYYY'
    )

    return (
      <TransactionActionsProvider>
        <div className={styles.HealthReimbursements}>
          <Section
            title={
              <>
                {t('Reimbursements.pending')}
                <Figure
                  symbol="€"
                  total={pendingAmount}
                  className={styles.HealthReimbursements__figure}
                  signed
                />{' '}
              </>
            }
          >
            {pendingTransactions && pendingTransactions.length > 0 ? (
              <TransactionList
                transactions={pendingTransactions}
                withScroll={false}
                className={styles.HealthReimbursements__transactionsList}
              />
            ) : (
              <Padded className="u-pv-0">
                <Caption>
                  {t('Reimbursements.noAwaiting', { period: formattedPeriod })}
                </Caption>
              </Padded>
            )}
          </Section>
          <Section title={t('Reimbursements.alreadyReimbursed')}>
            {reimbursedTransactions && reimbursedTransactions.length > 0 ? (
              <TransactionList
                transactions={reimbursedTransactions}
                withScroll={false}
                className={styles.HealthReimbursements__transactionsList}
              />
            ) : (
              <Padded className="u-pv-0">
                <Caption>
                  {t('Reimbursements.noReimbursed', {
                    period: formattedPeriod
                  })}
                </Caption>
                {!hasHealthBrands && (
                  <StoreLink type="konnector" category="insurance">
                    <KonnectorChip konnectorType="health" />
                  </StoreLink>
                )}
              </Padded>
            )}
          </Section>
        </div>
      </TransactionActionsProvider>
    )
  }
}

function mapStateToProps(state) {
  return {
    groupedHealthExpenses: getGroupedHealthExpensesByPeriod(state),
    currentPeriod: getPeriod(state)
  }
}

const HealthReimbursements = compose(
  translate(),
  queryConnect({
    transactions: transactionsConn
  }),
  connect(mapStateToProps),
  withFilters,
  // We need to have a different query name otherwise we end with an infinite
  // loading
  withBrands({ queryName: 'healthReimbursementsPageTriggers' })
)(DumbHealthReimbursements)

export default HealthReimbursements
