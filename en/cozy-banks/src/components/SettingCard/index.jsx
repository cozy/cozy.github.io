import React from 'react'
import { Card } from 'cozy-ui/react'
import styles from './styles.styl'
import cx from 'classnames'

const SettingCard = ({ enabled, clickable, ...props }) => {
  return (
    <Card
      {...props}
      className={cx(
        styles.SettingCard,
        !enabled && styles['SettingCard--disabled'],
        clickable && styles['SettingCard--clickable']
      )}
    />
  )
}

SettingCard.defaultProps = {
  enabled: true
}

export default SettingCard
