import React, { Component } from 'react'
import { connect } from 'react-redux'
import { queryConnect } from 'cozy-client'
import { transactionsConn } from 'doctypes'
import { flowRight as compose, sumBy, groupBy } from 'lodash'
import flag from 'cozy-flags'
import cx from 'classnames'
import { getHealthExpensesByPeriod } from 'ducks/filters'
import { TransactionsWithSelection } from 'ducks/transactions/Transactions'
import {
  isFullyReimbursed,
  getReimbursementStatus
} from 'ducks/transactions/helpers'
import { translate } from 'cozy-ui/react'
import { Title as BaseTitle } from 'cozy-ui/react/Text'
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

const Caption = props => {
  const { className, ...rest } = props

  return <p className={cx(styles.Caption, className)} {...rest} />
}

const Title = props => {
  const { className, ...rest } = props

  return (
    <BaseTitle
      className={cx(styles.HealthReimbursements__title, className)}
      {...rest}
    />
  )
}

export class DumbHealthReimbursements extends Component {
  componentDidMount() {
    this.props.addFilterByPeriod(getYear(new Date()).toString())
  }

  getGroups() {
    return groupBy(this.props.filteredTransactions, getReimbursementStatus)
  }

  render() {
    const {
      filteredTransactions,
      t,
      triggers,
      transactions,
      brands
    } = this.props
    const reimbursementTagFlag = flag('reimbursement-tag')

    if (
      (isCollectionLoading(transactions) && !hasBeenLoaded(transactions)) ||
      (isCollectionLoading(triggers) && !hasBeenLoaded(triggers))
    ) {
      return <Loading />
    }

    // This grouping logic should be extracted to a selector, so this is
    // easily memoizable
    const groupedTransactions = groupBy(
      filteredTransactions,
      reimbursementTagFlag ? getReimbursementStatus : isFullyReimbursed
    )

    const reimbursedTransactions = reimbursementTagFlag
      ? groupedTransactions.reimbursed
      : groupedTransactions.true

    const pendingTransactions = reimbursementTagFlag
      ? groupedTransactions.pending
      : groupedTransactions.false

    const pendingAmount = sumBy(pendingTransactions, t => -t.amount)

    const hasHealthBrands =
      brands.filter(brand => brand.hasTrigger && brand.health).length > 0

    return (
      <TransactionActionsProvider>
        <Section>
          <Title>
            <Padded className="u-pv-0">
              {t('Reimbursements.pending')}
              <Figure
                symbol="€"
                total={pendingAmount}
                className={styles.HealthReimbursements__figure}
                signed
              />{' '}
            </Padded>
          </Title>
          {pendingTransactions ? (
            <TransactionsWithSelection
              transactions={pendingTransactions}
              withScroll={false}
              className={styles.HealthReimbursements__transactionsList}
            />
          ) : (
            <Padded className="u-pv-0">
              <Caption>{t('Reimbursements.noAwaiting')}</Caption>
            </Padded>
          )}
        </Section>
        <Section>
          <Title>
            <Padded className="u-pv-0">
              {t('Reimbursements.alreadyReimbursed')}
            </Padded>
          </Title>
          {reimbursedTransactions ? (
            <TransactionsWithSelection
              transactions={reimbursedTransactions}
              withScroll={false}
              className={styles.HealthReimbursements__transactionsList}
            />
          ) : (
            <Padded className="u-pv-0">
              <Caption>{t('Reimbursements.noReimbursed')}</Caption>
              {!hasHealthBrands && (
                <StoreLink type="konnector" category="insurance">
                  <KonnectorChip konnectorType="health" />
                </StoreLink>
              )}
            </Padded>
          )}
        </Section>
      </TransactionActionsProvider>
    )
  }
}

function mapStateToProps(state) {
  return {
    filteredTransactions: getHealthExpensesByPeriod(state)
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
