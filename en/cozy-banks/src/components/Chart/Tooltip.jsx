import React from 'react'
import PropTypes from 'prop-types'
import styles from 'components/Chart/Tooltip.styl'
import cx from 'classnames'

const Tooltip = ({ children, x, position }) => (
  <div
    className={cx(styles.Tooltip, styles[`Tooltip_${position}`])}
    style={{ transform: `translateX(${x}px)`, [position]: 0 }}
  >
    {children}
  </div>
)

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  x: PropTypes.number.isRequired,
  position: PropTypes.oneOf(['left', 'right']).isRequired
}

export default Tooltip
