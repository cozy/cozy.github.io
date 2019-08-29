import React from 'react'
import PropTypes from 'prop-types'
import { flowRight as compose } from 'lodash'
import { findMatchingBrand } from 'ducks/brandDictionary'
import { translate } from 'cozy-ui/react'
import ButtonAction from 'cozy-ui/react/ButtonAction'
import flag from 'cozy-flags'
import icon from 'assets/icons/actions/icon-link-out.svg'
import styles from 'ducks/transactions/TransactionActions.styl'
import { TransactionModalRow } from 'ducks/transactions/TransactionModal'
import palette from 'cozy-ui/react/palette'
import { triggersConn } from 'doctypes'
import InformativeModal from 'ducks/transactions/actions/KonnectorAction/InformativeModal'
import ConfigurationModal from 'ducks/transactions/actions/KonnectorAction/ConfigurationModal'
import { getBrandsWithoutTrigger } from 'ducks/transactions/actions/KonnectorAction/helpers'
import match from 'ducks/transactions/actions/KonnectorAction/match'
import { KonnectorChip } from 'components/KonnectorChip'

const name = 'konnector'

const transactionModalRowStyle = { color: palette.dodgerBlue }
class Component extends React.Component {
  state = {
    showInformativeModal: false,
    showIntentModal: false
  }

  showInformativeModal = () =>
    this.setState({
      showInformativeModal: true
    })

  hideInformativeModal = () =>
    this.setState({
      showInformativeModal: false
    })

  showIntentModal = () =>
    this.setState({
      showIntentModal: true
    })

  hideIntentModal = () =>
    this.setState({
      showIntentModal: false
    })

  onInformativeModalConfirm = async () => {
    this.hideInformativeModal()
    this.showIntentModal()
  }

  onIntentComplete = () => {
    this.props.fetchTriggers()
    this.hideIntentModal()
  }

  findMatchingBrand() {
    const brandsWithoutTrigger = getBrandsWithoutTrigger(
      this.props.actionProps.brands
    )

    return findMatchingBrand(brandsWithoutTrigger, this.props.transaction.label)
  }

  renderModalItem(label) {
    return (
      <TransactionModalRow
        iconLeft="plus"
        style={transactionModalRowStyle}
        onClick={this.showInformativeModal}
      >
        {label}
      </TransactionModalRow>
    )
  }

  renderTransactionRow(label, brand) {
    const { compact } = this.props

    return flag('reimbursement-tag') ? (
      <KonnectorChip
        onClick={this.showInformativeModal}
        konnectorType={brand.health ? 'health' : 'generic'}
      />
    ) : (
      <ButtonAction
        label={label}
        leftIcon="plus"
        type="new"
        compact={compact}
        className={styles.TransactionActionButton}
        onClick={this.showInformativeModal}
      />
    )
  }

  render() {
    const { t, isModalItem } = this.props

    const brand = this.findMatchingBrand()
    if (!brand) return

    const healthOrGeneric = brand.health ? 'health' : 'generic'
    const label = t(`Transactions.actions.konnector.${healthOrGeneric}`)
    const translationKey = `Transactions.actions.informativeModal.${healthOrGeneric}`

    return (
      <>
        {isModalItem
          ? this.renderModalItem(label)
          : this.renderTransactionRow(label, brand)}
        {this.state.showInformativeModal && (
          <InformativeModal
            onCancel={this.hideInformativeModal}
            onConfirm={this.onInformativeModalConfirm}
            title={t(`${translationKey}.title`)}
            description={t(`${translationKey}.description`, {
              brandName: brand.name
            })}
            caption={t('Transactions.actions.informativeModal.caption')}
            cancelText={t('Transactions.actions.informativeModal.cancel')}
            confirmText={t('Transactions.actions.informativeModal.confirm')}
          />
        )}
        {this.state.showIntentModal && (
          <ConfigurationModal
            dismissAction={this.hideIntentModal}
            onComplete={this.onIntentComplete}
            slug={brand.konnectorSlug}
          />
        )}
      </>
    )
  }
}

Component.propTypes = {
  t: PropTypes.func.isRequired,
  transaction: PropTypes.object.isRequired,
  actionProps: PropTypes.object.isRequired,
  compact: PropTypes.bool,
  isModalItem: PropTypes.bool,
  fetchTriggers: PropTypes.func.isRequired
}

const mkFetchTriggers = client => () =>
  client.query(triggersConn.query(client), { as: triggersConn.as })
const addFetchTriggers = Component => {
  const res = (props, context) => (
    <Component {...props} fetchTriggers={mkFetchTriggers(context.client)} />
  )
  res.contextTypes = {
    client: PropTypes.object.isRequired
  }
  res.displayName = `withAddTrigger(${Component.displayName})`
  return res
}

const action = {
  name,
  icon,
  match,
  Component: compose(
    translate(),
    addFetchTriggers
  )(Component)
}

export default action
