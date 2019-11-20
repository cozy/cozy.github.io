import React from 'react'
import { Media, Bd, Img, Icon } from 'cozy-ui/transpiled/react'
import styles from './Row.styl'
import cx from 'classnames'

export const RowBody = ({ children }) => (
  <Bd className="u-ellipsis">{children}</Bd>
)

const Row = ({
  isSelected,
  icon,
  label,
  children,
  hasArrow,
  onClick,
  className
}) => (
  <Media
    className={cx(
      styles.Row,
      'u-row-m',
      isSelected ? 'u-text-bold' : '',
      className
    )}
    onClick={onClick}
  >
    {icon && <Img>{icon}</Img>}
    {label ? <RowBody>{label}</RowBody> : null}
    {children}
    {hasArrow && (
      <Img>
        <Icon icon="right" color="var(--coolGrey)" />
      </Img>
    )}
  </Media>
)

export default Row
