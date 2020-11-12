import React from 'react'
import { Media, Bd, Img, Icon, Radio } from 'cozy-ui/transpiled/react'
import styles from './Row.styl'
import cx from 'classnames'

import RightIcon from 'cozy-ui/transpiled/react/Icons/Right'

export const RowBody = ({ children }) => (
  <Bd className="u-ellipsis">{children}</Bd>
)

const Row = ({
  isSelected,
  icon,
  label,
  children,
  hasArrow,
  hasRadio,
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
        <Icon icon={RightIcon} color="var(--coolGrey)" />
      </Img>
    )}
    {hasRadio && (
      <Img>
        <Radio readOnly checked={isSelected} />
      </Img>
    )}
  </Media>
)

export default Row
