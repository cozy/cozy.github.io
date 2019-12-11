import React from 'react'
import { Card } from 'cozy-ui/react'
import styles from './styles.styl'
import cx from 'classnames'

const SettingCard = ({ enabled, ...props }) => {
  return (
    <Card
      {...props}
      className={cx(
        styles.SettingCard,
        !enabled && styles['SettingCard--disabled'],
        props.onClick && styles['SettingCard--clickable']
      )}
    />
  )
}

SettingCard.defaultProps = {
  enabled: true
}

export default SettingCard
