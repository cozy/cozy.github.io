import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'cozy-ui/react'
import SelectBox from 'cozy-ui/react/SelectBox'
import { getAccountLabel, getAccountType } from 'ducks/account/helpers'
import {
  ToggleRowWrapper,
  ToggleRowTitle,
  ToggleRowInput,
  ToggleRowToggle,
  ToggleRowContent,
  ToggleRowDescription
} from 'ducks/settings/ToggleRow'
import styles from 'ducks/settings/DelayedDebitAlert.styl'

const parseNumber = val => {
  val = val.replace(/\D/gi, '') || 0
  return parseInt(val, 10)
}

class DumbDelayedDebitAlert extends React.Component {
  static propTypes = {
    // TODO replace `PropTypes.object` with a shape coming from cozy-doctypes
    accounts: PropTypes.arrayOf(PropTypes.object).isRequired,
    enabled: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    onAccountsChange: PropTypes.func.isRequired
  }

  state = {
    creditCardAccount: null,
    checkingsAccount: null
  }

  static getDerivedStateFromProps(props, state) {
    const selectedCreditCard = DumbDelayedDebitAlert.prototype.getSelectedCreditCard.call(
      { props }
    )

    return {
      creditCardAccount: state.creditCardAccount || selectedCreditCard,
      checkingsAccount:
        state.checkingsAccount ||
        (selectedCreditCard && selectedCreditCard.checkingsAccount.data)
    }
  }

  onCreditCardChange = selected => {
    const account = this.props.accounts.find(
      account => account._id === selected.value
    )

    this.setState({ creditCardAccount: account })
  }

  onCheckingsChange = selected => {
    const account = this.props.accounts.find(
      account => account._id === selected.value
    )

    this.setState({ checkingsAccount: account })
  }

  onAccountChange = changes => {
    this.props.onAccountsChange(changes)
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.creditCardAccount !== this.state.creditCardAccount ||
      prevState.checkingsAccount !== this.state.checkingsAccount
    ) {
      if (this.state.creditCardAccount && this.state.checkingsAccount) {
        this.onAccountChange({
          previousCreditCard: prevState.creditCardAccount,
          newCreditCard: this.state.creditCardAccount,
          newCheckings: this.state.checkingsAccount
        })
      }
    }
  }

  makeOption(account) {
    return {
      value: account._id,
      label: getAccountLabel(account)
    }
  }

  getCreditCardOptions() {
    const accounts = this.props.accounts.filter(
      account => getAccountType(account) === 'CreditCard'
    )

    return accounts.map(this.makeOption)
  }

  getCheckingsOptions() {
    const accounts = this.props.accounts.filter(
      account => getAccountType(account) === 'Checkings'
    )

    return accounts.map(this.makeOption)
  }

  getSelectedCreditCard() {
    const selectedAccount = this.props.accounts.find(
      account =>
        getAccountType(account) === 'CreditCard' &&
        account.checkingsAccount.data
    )

    return selectedAccount
  }

  getCreditCardDefaultValue() {
    const selectedAccount = this.getSelectedCreditCard()

    return selectedAccount ? this.makeOption(selectedAccount) : null
  }

  getCheckingsDefaultValue() {
    const selectedCreditCard = this.getSelectedCreditCard()

    return selectedCreditCard && selectedCreditCard.checkingsAccount.data
      ? this.makeOption(selectedCreditCard.checkingsAccount.data)
      : null
  }

  render() {
    const { enabled, value, onToggle, onChangeValue, t } = this.props

    return (
      <ToggleRowWrapper>
        <ToggleRowTitle>
          {t('Notifications.delayed_debit.settingTitle')}
        </ToggleRowTitle>
        <ToggleRowContent>
          <ToggleRowDescription>
            {t('Notifications.delayed_debit.description.start')}
            <SelectBox
              size="tiny"
              className={styles.SelectBox}
              options={this.getCreditCardOptions()}
              defaultValue={this.getCreditCardDefaultValue()}
              onChange={this.onCreditCardChange}
            />
            {t('Notifications.delayed_debit.description.accountsGlue')}
            <SelectBox
              size="tiny"
              className={styles.SelectBox}
              options={this.getCheckingsOptions()}
              defaultValue={this.getCheckingsDefaultValue()}
              onChange={this.onCheckingsChange}
            />
            <ToggleRowInput
              value={value}
              onChange={e => onChangeValue(parseNumber(e.target.value))}
              unit={t('Notifications.delayed_debit.unit')}
            />
            {t('Notifications.delayed_debit.description.end')}
          </ToggleRowDescription>

          <ToggleRowToggle
            id="delayedDebit"
            checked={enabled}
            onToggle={checked => onToggle(checked)}
          />
        </ToggleRowContent>
      </ToggleRowWrapper>
    )
  }
}

const DelayedDebitAlert = translate()(DumbDelayedDebitAlert)

export default DelayedDebitAlert
