import React, { useMemo } from 'react'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import Padded from 'components/Padded'
import cx from 'classnames'
import { ConnectedSelectDates } from 'components/SelectDates'
import Reimbursements from 'ducks/reimbursements/Reimbursements'
import { BalanceDetailsHeader } from 'ducks/balance'
import {
  subMonths,
  format,
  endOfDay,
  differenceInCalendarMonths
} from 'date-fns'

const start2016 = new Date(2015, 11, 31)

const getDefaultOptions = () => {
  const options = []
  const now = endOfDay(new Date())

  for (let i = 0; i < differenceInCalendarMonths(now, start2016); i++) {
    const month = format(subMonths(now, i), 'YYYY-MM')
    options.push({
      yearMonth: month
    })
  }

  return options
}

const ReimbursementsPage = () => {
  const { isMobile } = useBreakpoints()
  const options = useMemo(() => getDefaultOptions(), [])

  return (
    <>
      <BalanceDetailsHeader showBalance>
        <Padded
          className={cx({
            'u-ph-half': isMobile,
            'u-pv-0': isMobile,
            'u-pb-half': isMobile,
            'u-pt-half': !isMobile
          })}
        >
          <ConnectedSelectDates
            showFullYear
            color="primary"
            options={options}
          />
        </Padded>
      </BalanceDetailsHeader>
      <Reimbursements />
    </>
  )
}

export default ReimbursementsPage
