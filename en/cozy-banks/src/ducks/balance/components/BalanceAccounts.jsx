import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import { translate } from 'cozy-ui/react'
import Button from 'cozy-ui/react/Button'

import AddAccountLink from 'ducks/settings/AddAccountLink'
import btnStyles from 'styles/buttons.styl'

import BalanceTable from 'ducks/balance/components/BalanceTable'
import BalanceRow from 'ducks/balance/components/BalanceRow'

class BalanceAccounts extends React.PureComponent {
  render() {
    const { accounts, balanceLower, t } = this.props
    const names = [
      t('Accounts.label'),
      t('Balance.solde'),
      t('Balance.account_number'),
      t('Balance.bank_name')
    ]

    return (
      <div>
        <h3>{t('AccountSwitch.accounts')}</h3>
        <BalanceTable names={names}>
          {accounts.map((account, index) => (
            <BalanceRow
              key={index}
              account={account}
              warningLimit={balanceLower}
            />
          ))}
        </BalanceTable>
        <p>
          <AddAccountLink>
            <Button
              className={cx(btnStyles['btn--no-outline'], 'u-pv-1')}
              icon="plus"
              label={t('Accounts.add-account')}
            />
          </AddAccountLink>
        </p>
      </div>
    )
  }
}

BalanceAccounts.propTypes = {
  balanceLower: PropTypes.number.isRequired,
  accounts: PropTypes.array.isRequired
}

export default translate()(BalanceAccounts)
