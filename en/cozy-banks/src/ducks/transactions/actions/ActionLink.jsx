import React from 'react'
import styles from 'ducks/transactions/TransactionActions.styl'
import palette from 'cozy-ui/transpiled/react/palette'
import Icon from 'cozy-ui/transpiled/react/Icon'

const iconStyle = { marginRight: '10px' }
const ActionLink = ({
  href,
  text,
  target,
  onClick,
  icon,
  color = palette.dodgerBlue
}) => (
  <a
    href={href}
    target={target}
    onClick={onClick}
    style={{ color }}
    className={styles.TransactionAction}
  >
    {icon && <Icon icon={icon} style={iconStyle} />}
    {text}
  </a>
)

export default ActionLink
