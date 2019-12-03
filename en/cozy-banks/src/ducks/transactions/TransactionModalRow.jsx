import React from 'react'
import { Media, Bd, Img, Icon } from 'cozy-ui/react'
import cx from 'classnames'

import styles from 'ducks/transactions/TransactionModalRow.styl'

export const RowArrow = () => <Icon icon="right" color="var(--coolGrey)" />

export const TransactionModalRowIcon = ({ icon }) =>
  icon ? (
    <Img className="u-ph-half">
      {Icon.isProperIcon(icon) ? <Icon icon={icon} width={16} /> : icon}
    </Img>
  ) : null

export const TransactionModalRowMedia = props => {
  const { disabled, className, children, ...restProps } = props
  return (
    <Media
      className={cx(
        styles.TransactionModalRow,
        'u-row-m',
        {
          [styles['TransactionModalRow-disabled']]: disabled,
          [styles['TransactionModalRow-clickable']]: props.onClick,
          'u-c-pointer': restProps.onClick
        },
        className
      )}
      {...restProps}
    >
      {children}
    </Media>
  )
}

const TransactionModalRow = ({ children, iconLeft, iconRight, ...props }) => (
  <TransactionModalRowMedia {...props}>
    <TransactionModalRowIcon icon={iconLeft} />
    <Bd className="u-stack-xs">{children}</Bd>
    {iconRight && <Img>{iconRight}</Img>}
  </TransactionModalRowMedia>
)

export default TransactionModalRow
