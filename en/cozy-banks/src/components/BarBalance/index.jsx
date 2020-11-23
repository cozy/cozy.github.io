import React from 'react'
import sumBy from 'lodash/sumBy'
import styles from 'components/BarBalance/styles.styl'
import Figure from 'cozy-ui/transpiled/react/Figure'
import BarItem from 'components/BarItem'
import { getAccountBalance } from 'ducks/account/helpers'

const BarBalance = ({ accounts }) => {
  return (
    <BarItem>
      <Figure
        className={styles['BarBalance']}
        symbol="€"
        decimalNumbers={0}
        coloredPositive={false}
        coloredNegative={false}
        total={sumBy(accounts, getAccountBalance)}
      />
    </BarItem>
  )
}

export default BarBalance
