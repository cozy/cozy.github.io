import { useClient, useQuery } from 'cozy-client'
import React from 'react'
import { withRouter } from 'react-router'
import {
  recurrenceConn,
  RECURRENCE_DOCTYPE,
  bundleTransactionsQueryConn
} from 'doctypes'

import { SubTitle } from 'cozy-ui/transpiled/react/Text'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Breadcrumbs from 'cozy-ui/transpiled/react/Breadcrumbs'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

import Loading from 'components/Loading'
import Padded from 'components/Spacing/Padded'
import {
  RowDesktop as TransactionRowDesktop,
  RowMobile as TransactionRowMobile
} from 'ducks/transactions/TransactionRow'
import Table from 'components/Table'
import Header from 'components/Header'
import BackButton from 'components/BackButton'
import BarTheme from 'ducks/bar/BarTheme'
import cx from 'classnames'
import { prettyLabel } from 'ducks/recurrence/utils'

import styles from 'ducks/categories/CategoriesHeader.styl'
import AnalysisTabs from 'ducks/analysis/AnalysisTabs'
import { BarTitle } from 'components/Title/PageTitle'
import TransactionsTableHead from 'ducks/transactions/header/TableHead'

const useDocument = (doctype, id) => {
  const client = useClient()
  return client.getDocumentFromState(doctype, id)
}

const BundleInfo = withRouter(({ bundle, router }) => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  if (!bundle) {
    return null
  }

  const goToRecurrenceRoot = () => router.push('/recurrence')

  return (
    <Header fixed theme="primary">
      {isMobile ? (
        <>
          <BackButton theme="primary" onClick={goToRecurrenceRoot} />
          <BarTitle>{prettyLabel(bundle.label)}</BarTitle>
          <AnalysisTabs />
        </>
      ) : (
        <>
          <Padded>
            <SubTitle>
              <Breadcrumbs
                items={[
                  {
                    name: t('Recurrence.title'),
                    onClick: goToRecurrenceRoot
                  },
                  {
                    name: prettyLabel(bundle.label)
                  }
                ]}
                className={cx(styles.primary)}
                theme="primary"
              />
              <BackButton theme="primary" />
            </SubTitle>
          </Padded>
          <TransactionsTableHead />
        </>
      )}
    </Header>
  )
})

const BundleTransactions = ({ bundle }) => {
  const transactionsConn = bundleTransactionsQueryConn({ bundle })
  const { isMobile } = useBreakpoints()
  const { data: transactions } = useQuery(
    transactionsConn.query,
    transactionsConn
  )

  if (!transactions) {
    return null
  }

  const TransactionRow = isMobile ? TransactionRowMobile : TransactionRowDesktop
  return (
    <>
      <Table style={{ flex: 'none' }}>
        {transactions.map(tr => (
          <TransactionRow transaction={tr} key={tr._id} />
        ))}
      </Table>
    </>
  )
}

const RecurrenceBundlePage = ({ params }) => {
  const { data: bundles, fetchStatus } = useQuery(
    recurrenceConn.query,
    recurrenceConn
  )

  const bundleId = params.bundleId
  const bundle = useDocument(RECURRENCE_DOCTYPE, bundleId)

  if (fetchStatus === 'loading' && !bundles) {
    return <Loading />
  }

  return (
    <>
      <BarTheme theme="primary" />
      {bundle ? <BundleInfo bundle={bundle} /> : null}
      {bundle ? <BundleTransactions bundle={bundle} /> : null}
    </>
  )
}

export default withRouter(RecurrenceBundlePage)
