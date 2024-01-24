import React, { memo } from 'react'

import { useQuery } from 'cozy-client'
import flag from 'cozy-flags'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import { makeBalanceTransactionsConn } from 'doctypes'
import Padded from 'components/Padded'
import Header from 'components/Header'
import KonnectorUpdateInfo from 'components/KonnectorUpdateInfo'
import History, { HistoryFallback } from 'ducks/balance/History'
import HeaderTitle from 'ducks/balance/HeaderTitle'
import Delayed from 'components/Delayed'

import styles from 'ducks/balance/BalanceHeader.styl'
import LegalMention from 'ducks/legal/LegalMention'
import PageTitleBalanceHeader from 'ducks/balance/PageTitleBalanceHeader'

const BalanceHeader = ({
  accountsBalance,
  accounts,
  subtitleParams,
  onClickBalance
}) => {
  const conn = makeBalanceTransactionsConn()
  const transactions = useQuery(conn.query, conn)
  const { t } = useI18n()
  const subtitle = subtitleParams
    ? t('BalanceHistory.checked-accounts', subtitleParams)
    : t('BalanceHistory.all-accounts')

  return (
    <Header className={styles.BalanceHeader} theme="inverted">
      <PageTitleBalanceHeader />
      <HeaderTitle
        balance={accountsBalance}
        subtitle={subtitle}
        onClickBalance={onClickBalance}
      />
      {accounts && (
        <Delayed
          fallback={<HistoryFallback />}
          delay={flag('balance.no-delay-history') ? 0 : 1000}
        >
          <History
            animation={!flag('balance.no-history-animation')}
            accounts={accounts}
            transactions={transactions}
          />
        </Delayed>
      )}
      <KonnectorUpdateInfo />
      {LegalMention.active ? (
        <Padded className="u-pb-0">
          <LegalMention />
        </Padded>
      ) : null}
    </Header>
  )
}

export default memo(BalanceHeader)
