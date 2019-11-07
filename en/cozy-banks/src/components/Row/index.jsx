import React from 'react'
import { Media, Bd, Img, Icon } from 'cozy-ui/transpiled/react'
import styles from './Row.styl'
import cx from 'classnames'

const Row = ({ isSelected, icon, label, hasArrow, onClick, className }) => (
  <Media
    className={cx(styles.Row, isSelected ? ' u-text-bold' : '', className)}
    onClick={onClick}
  >
    {icon && <Img className="u-pr-1">{icon}</Img>}
    <Bd className="u-ellipsis">{label}</Bd>
    {hasArrow && (
      <Img className="u-pl-1">
        <Icon icon="right" color="var(--coolGrey)" />
      </Img>
    )}
  </Media>
)

export default Row
