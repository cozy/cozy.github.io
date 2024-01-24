import React from 'react'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Icon from 'cozy-ui/transpiled/react/Icon'
import { formatVendor } from 'ducks/health-expense/helpers'
import palette from 'cozy-ui/transpiled/react/palette'

import HourglassIcon from 'cozy-ui/transpiled/react/Icons/Hourglass'

const healthExpenseStatusIconStyle = { display: 'inline-block' }
export const HealthExpenseStatusIcon = ({ className = '', pending }) => {
  const color = pending ? palette.pomegranate : palette.dodgerBlue

  return (
    <span style={healthExpenseStatusIconStyle} className={className}>
      <Icon icon={HourglassIcon} color={color} />
    </span>
  )
}

const HealthExpenseStatus = ({ vendors = [], showIcon = true }) => {
  const { t } = useI18n()
  const pending = vendors.length === 0
  const formattedVendors = vendors.map(formatVendor)

  return (
    <span>
      {showIcon && (
        <HealthExpenseStatusIcon className="u-mr-half" pending={pending} />
      )}
      {pending
        ? t('Transactions.actions.healthExpensePending')
        : t('Transactions.actions.healthExpenseStatus').replace(
            '%{vendors}',
            formattedVendors.join(` ${t('Transactions.actions.vendorsGlue')} `)
          )}
    </span>
  )
}

export default HealthExpenseStatus
