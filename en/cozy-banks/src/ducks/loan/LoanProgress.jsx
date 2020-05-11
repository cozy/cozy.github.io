import React from 'react'
import PercentageBar from 'cozy-ui/transpiled/react/PercentageBar'
import { Caption } from 'cozy-ui/transpiled/react/Text'
import Figure from 'cozy-ui/transpiled/react/Figure'
import {
  getReimbursedPercentage,
  getReimbursedAmount,
  getBorrowedAmount
} from 'ducks/account/helpers'
import { useI18n } from 'cozy-ui/transpiled/react'

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
      <PercentageBar value={percentage} color="var(--emerald)" />
      <div className="u-flex u-mt-half">
        <div className="u-flex-grow-1">
          <Figure total={reimbursedAmount} symbol="€" coloredPositive />
          <Caption>{t('LoanProgress.reimbursedAmount')}</Caption>
        </div>
        <div className="u-flex-grow-1 u-ta-right">
          <Figure total={borrowedAmount} symbol="€" />
          <Caption>{t('LoanProgress.borrowedAmount')}</Caption>
        </div>
      </div>
    </>
  )
}

export default LoanProgress
