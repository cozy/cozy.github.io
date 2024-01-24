import React from 'react'

import { isQueryLoading } from 'cozy-client'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import Icon from 'cozy-ui/transpiled/react/Icon'
import Tooltip from 'cozy-ui/transpiled/react/Tooltip'
import HistoryIcon from 'cozy-ui/transpiled/react/Icons/History'

const EarliestTransactionDate = ({
  transaction,
  transactionCol,
  onFetchMore
}) => {
  const { t, f } = useI18n()

  if (!transaction) return null
  return (
    <div>
      {t('Search.since', { date: f(transaction.date, 'D MMM YYYY') })}
      {transactionCol.hasMore ? (
        <Tooltip title={t('Search.search-older-transactions')}>
          <IconButton
            disabled={isQueryLoading(transactionCol)}
            onClick={onFetchMore}
            size="medium"
          >
            <Icon icon={HistoryIcon} />
          </IconButton>
        </Tooltip>
      ) : null}
    </div>
  )
}

export default React.memo(EarliestTransactionDate)
