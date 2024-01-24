import React from 'react'

import { useQuery, isQueryLoading, hasQueryBeenLoaded } from 'cozy-client'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Empty from 'cozy-ui/transpiled/react/Empty'
import ListSubheader from 'cozy-ui/transpiled/react/ListSubheader'

import Table from 'components/Table'
import Padded from 'components/Padded'
import Loading from 'components/Loading'
import TransactionRowDesktop from 'ducks/transactions/TransactionRow/TransactionRowDesktop'
import TransactionRowMobile from 'ducks/transactions/TransactionRow/TransactionRowMobile'
import LegalMention from 'ducks/legal/LegalMention'
import { bundleTransactionsQueryConn } from 'ducks/recurrence/queries'

const BundleTransactionMobile = ({ transaction }) => {
  const { f } = useI18n()
  const { date } = transaction
  return (
    <>
      <ListSubheader>{f(date, 'dddd D MMMM')}</ListSubheader>
      <TransactionRowMobile showRecurrence={false} transaction={transaction} />
    </>
  )
}

const BundleMobileWrapper = ({ children }) => {
  return <div className="u-mt-3">{children}</div>
}

const BundleDesktopWrapper = ({ children }) => {
  return (
    <Table>
      <tbody>{children}</tbody>
    </Table>
  )
}

const BundleTransactions = ({ bundle }) => {
  const transactionsConn = bundleTransactionsQueryConn({ bundle })
  const { isMobile } = useBreakpoints()
  const { t } = useI18n()
  const transactionCol = useQuery(transactionsConn.query, transactionsConn)

  if (isQueryLoading(transactionCol) && !hasQueryBeenLoaded(transactionCol)) {
    return <Loading />
  }

  const { data: transactions, fetchStatus, lastError } = transactionCol

  const TransactionRow = isMobile
    ? BundleTransactionMobile
    : TransactionRowDesktop
  const Wrapper = isMobile ? BundleMobileWrapper : BundleDesktopWrapper

  return (
    <>
      <Wrapper>
        <LegalMention className="u-m-1" />
        {transactions.length === 0 && (
          <Padded>
            {fetchStatus === 'failed' ? (
              <>
                <p>{t('Loading.error')}</p>
                <p>{lastError && lastError.message}</p>
              </>
            ) : (
              <Empty
                icon={{}}
                title={t('Recurrence.no-transactions.title')}
                text={t('Recurrence.no-transactions.text')}
              />
            )}
          </Padded>
        )}
        {transactions.map(tr => (
          <TransactionRow
            showRecurrence={false}
            transaction={tr}
            key={tr._id}
          />
        ))}
      </Wrapper>
    </>
  )
}

export default React.memo(BundleTransactions)
