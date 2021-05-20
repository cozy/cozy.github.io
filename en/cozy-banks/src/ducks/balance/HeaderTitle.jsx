import React, { memo } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import styles from 'ducks/balance/HeaderTitle.styl'
import Figure from 'cozy-ui/transpiled/react/Figure'

const HeaderTitle = ({ balance, subtitle, onClickBalance, className }) => (
  <div className={cx(styles.HeaderTitle, className)}>
    {balance !== undefined && (
      <Figure
        onClick={onClickBalance}
        className={styles.HeaderTitle_balance}
        total={balance}
        symbol="€"
      />
    )}
    <div className={styles.HeaderTitle_subtitle}>{subtitle}</div>
  </div>
)

HeaderTitle.propTypes = {
  balance: PropTypes.number,
  onClickBalance: PropTypes.func,
  subtitle: PropTypes.string.isRequired
}

HeaderTitle.defaultProps = {
  onClickBalance: undefined,
  balance: undefined,
  className: undefined
}

export default memo(HeaderTitle)
