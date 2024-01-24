import React from 'react'
import PercentageBar from 'cozy-ui/transpiled/react/deprecated/PercentageBar'
import Figure from 'cozy-ui/transpiled/react/Figure'
import {
  getReimbursedPercentage,
  getReimbursedAmount,
  getBorrowedAmount
} from 'ducks/account/helpers'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Typography from 'cozy-ui/transpiled/react/Typography'

const LoanProgress = props => {
  const { t } = useI18n()
  const { account } = props
  const percentage = getReimbursedPercentage(account)
  const reimbursedAmount = getReimbursedAmount(account)
  const borrowedAmount = getBorrowedAmount(account)

  if (!reimbursedAmount && !borrowedAmount) {
    return null
  }

  return (
    <>
      <PercentageBar value={percentage} color="var(--successColor)" />
      <div className="u-flex u-mt-half">
        <div className="u-flex-grow-1">
          <Figure total={reimbursedAmount} symbol="€" coloredPositive />
          <Typography variant="caption" color="textSecondary">
            {t('LoanProgress.reimbursedAmount')}
          </Typography>
        </div>
        <div className="u-flex-grow-1 u-ta-right">
          <Figure total={borrowedAmount} symbol="€" />
          <Typography variant="caption" color="textSecondary">
            {t('LoanProgress.borrowedAmount')}
          </Typography>
        </div>
      </div>
    </>
  )
}

export default LoanProgress
