import React, { memo } from 'react'
import { flowRight as compose } from 'lodash'
import { translate, withBreakpoints } from 'cozy-ui/react'

import { transactionsConn } from 'doctypes'
import { Padded } from 'components/Spacing'
import Header from 'components/Header'
import { PageTitle } from 'components/Title'
import KonnectorUpdateInfo from 'components/KonnectorUpdateInfo'
import History from 'ducks/balance/History'
import HeaderTitle from 'ducks/balance/components/HeaderTitle'
import Delayed from 'components/Delayed'
import { queryConnect } from 'cozy-client'

import styles from 'ducks/balance/components/BalanceHeader.styl'

const BalanceHeader = ({
  t,
  breakpoints: { isMobile },
  accountsBalance,
  accounts,
  subtitleParams,
  onClickBalance,
  transactions
}) => {
  const titlePaddedClass = isMobile ? 'u-p-0' : 'u-pb-0'
  const titleColor = isMobile ? 'primary' : 'default'
  const subtitle = subtitleParams
    ? t('BalanceHistory.checked_accounts', subtitleParams)
    : t('BalanceHistory.all_accounts')

  return (
    <Header className={styles.BalanceHeader} color="primary">
      {isMobile && (
        <Padded className={titlePaddedClass}>
          <PageTitle color={titleColor}>{t('Balance.title')}</PageTitle>
        </Padded>
      )}
      <HeaderTitle
        balance={accountsBalance}
        subtitle={subtitle}
        onClickBalance={onClickBalance}
      />
      {accounts && (
        <Delayed delay={1000}>
          <History accounts={accounts} transactions={transactions} />
        </Delayed>
      )}
      <KonnectorUpdateInfo />
    </Header>
  )
}

export const DumbBalanceHeader = BalanceHeader

export default compose(
  withBreakpoints(),
  translate(),
  memo,
  queryConnect({
    transactions: transactionsConn
  })
)(BalanceHeader)
