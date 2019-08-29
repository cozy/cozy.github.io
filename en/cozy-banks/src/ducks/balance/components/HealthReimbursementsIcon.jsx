import React from 'react'
import Icon from 'cozy-ui/react/Icon'
import cx from 'classnames'
import healthCatIcon from 'assets/icons/categories/icon-cat-health.svg'
import styles from 'ducks/balance/components/ReimbursementsIcon.styl'
import { getCssVariableValue } from 'cozy-ui/react/utils/color'

export default function ReimbursementsIcon(props) {
  const { className, icon, ...rest } = props

  return (
    <span className={cx(styles.ReimbursementsIcon, className)}>
      <Icon icon={icon} {...rest} />
      <span className={cx(styles.ReimbursementsIcon__hourglass)}>
        <Icon
          icon="hourglass"
          size={8}
          color={getCssVariableValue('coolGrey')}
        />
      </span>
    </span>
  )
}

export function HealthReimbursementsIcon() {
  return <ReimbursementsIcon icon={healthCatIcon} size={24} />
}
