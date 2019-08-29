import React from 'react'
import { withBreakpoints } from 'cozy-ui/react'
import { Table } from 'components/Table'
import styles from 'ducks/balance/components/BalanceTable.styl'

class BalanceTable extends React.PureComponent {
  render() {
    const {
      breakpoints: { isMobile },
      names,
      children
    } = this.props

    return (
      <Table className={styles.BalanceTable}>
        {!isMobile && (
          <thead>
            <tr>
              <td className={styles.ColumnName}>{names[0]}</td>
              <td className={styles.ColumnSolde}>{names[1]}</td>
              <td className={styles.ColumnAccount}>{names[2]}</td>
              <td className={styles.ColumnBank}>{names[3]}</td>
            </tr>
          </thead>
        )}
        <tbody>{children}</tbody>
      </Table>
    )
  }
}

export default withBreakpoints()(BalanceTable)
