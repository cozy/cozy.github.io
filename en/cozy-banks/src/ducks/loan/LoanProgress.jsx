import React from 'react'
import PercentageBar from 'cozy-ui/transpiled/react/PercentageBar'
import { translate } from 'cozy-ui/transpiled/react/I18n'
import { Caption } from 'cozy-ui/transpiled/react/Text'
import { Figure } from 'components/Figure'
import {
  getReimbursedPercentage,
  getReimbursedAmount,
  getBorrowedAmount
} from 'ducks/account/helpers'

const DumbLoanProgress = props => {
  const { account, t } = props
  const percentage = getReimbursedPercentage(account)
  const reimbursedAmount = getReimbursedAmount(account)
  const borrowedAmount = getBorrowedAmount(account)

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

const LoanProgress = translate()(DumbLoanProgress)

export default LoanProgress
