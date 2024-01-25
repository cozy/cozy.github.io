import React from 'react'
import styles from 'components/Table/styles.styl'
import cx from 'classnames'
import { useCozyTheme } from 'cozy-ui/transpiled/react/providers/CozyTheme'

export const Row = ({ nav, ...props }) => {
  return (
    <tr
      role="row"
      {...props}
      className={cx(styles.Table__Row, nav && styles['Table__Row--nav'])}
    >
      {props.children}
    </tr>
  )
}

export const Cell = ({ main, children, ...props }) => {
  return (
    <td
      role="cell"
      {...props}
      className={cx(
        props.className,
        styles.Table__Cell,
        main && styles['Table__Cell--main']
      )}
    >
      {children}
    </td>
  )
}

/**
 * Used to display tabular data.
 * Column widths MUST be explicitly set with `flex-basis` AND `max-width`.
 *
 * https://github.com/philipwalton/flexbugs/issues/3
 */
export const Table = ({ children, className, ...rest }) => {
  const { variant } = useCozyTheme()
  return (
    <table
      className={cx(styles['Table'], variant && styles[variant], className)}
      {...rest}
    >
      {children}
    </table>
  )
}

export const TdSecondary = ({ children, className, ...rest }) => (
  <td className={cx(styles['Table-td-secondary'], className)} {...rest}>
    {children}
  </td>
)

export default Table
