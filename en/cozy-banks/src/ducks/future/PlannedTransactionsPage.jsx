import React from 'react'
import cx from 'classnames'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Empty from 'cozy-ui/transpiled/react/Empty'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

import Padded from 'components/Padded'
import Loading from 'components/Loading'
import { TransactionList } from 'ducks/transactions/Transactions'
import LegalMention from 'ducks/legal/LegalMention'
import { useTrackPage } from 'ducks/tracking/browser'
import { DESKTOP_SCROLLING_ELEMENT_CLASSNAME } from 'ducks/transactions/scroll/getScrollingElement'
import useEstimatedBudget from 'ducks/future/useEstimatedBudget'
import PlannedTransactionsPageHeader from 'ducks/future/PlannedTransactionsPageHeader'

import styles from './styles.styl'

const PlannedTransactionsPage = ({ emptyIcon }) => {
  const budget = useEstimatedBudget()
  const { t } = useI18n()
  const { isMobile, isTablet } = useBreakpoints()
  useTrackPage('previsionnel')

  return (
    <>
      <PlannedTransactionsPageHeader />
      <div
        className={cx(DESKTOP_SCROLLING_ELEMENT_CLASSNAME, {
          [styles['List--mobile']]: isMobile,
          [styles['List--tablet']]: isTablet
        })}
      >
        {/* Necessary to offset vertically the content in the scrolling area when the LegalMention is displayed */}
        {LegalMention.active && <div className="u-mt-2"> </div>}
        {budget.isLoading ? (
          <Padded>
            <Loading />
          </Padded>
        ) : (
          <>
            {budget.transactions && budget.transactions.length > 0 && (
              <TransactionList
                transactions={budget.transactions}
                showTriggerErrors={false}
              />
            )}
            {budget.transactions && budget.transactions.length === 0 && (
              <div className={isMobile ? 'u-mh-half' : ''}>
                <Empty
                  icon={emptyIcon}
                  title={t('EstimatedBudget.no-planned-transactions.title')}
                  text={
                    <>✨ {t('EstimatedBudget.no-planned-transactions.text')}</>
                  }
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

PlannedTransactionsPage.defaultProps = {
  emptyIcon: 'cozy'
}

export default PlannedTransactionsPage
