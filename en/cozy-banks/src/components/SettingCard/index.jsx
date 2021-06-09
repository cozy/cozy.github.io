import React from 'react'
import { Card } from 'cozy-ui/transpiled/react/Card'
import styles from './styles.styl'
import cx from 'classnames'

const SettingCard = ({ enabled, className, ...props }) => {
  return (
    <Card
      {...props}
      className={cx(
        styles.SettingCard,
        className,
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
