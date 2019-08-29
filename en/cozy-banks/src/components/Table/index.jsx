import React from 'react'
import styles from 'components/Table/styles.styl'
import cx from 'classnames'

/**
 * Used to display tabular data.
 * Column widths MUST be explicitly set with `flex-basis` AND `max-width`.
 *
 * https://github.com/philipwalton/flexbugs/issues/3
 */
export const Table = ({ children, className, color, ...rest }) => (
  <table className={cx(styles['c-table'], styles[color], className)} {...rest}>
    {children}
  </table>
)

export const TdSecondary = ({ children, className, ...rest }) => (
  <td className={cx(styles['c-table-td-secondary'], className)} {...rest}>
    {children}
  </td>
)

export default Table
