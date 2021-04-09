import React from 'react'
import PropTypes from 'prop-types'
import compose from 'lodash/flowRight'

import { translate } from 'cozy-ui/transpiled/react/I18n'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconPlus from 'cozy-ui/transpiled/react/Icons/Plus'
import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

import icon from 'assets/icons/actions/icon-link-out.svg'
import palette from 'cozy-ui/transpiled/react/palette'
import { cronKonnectorTriggersConn } from 'doctypes'
import InformativeDialog from 'ducks/transactions/actions/KonnectorAction/InformativeDialog'
import ConfigurationModal from 'ducks/transactions/actions/KonnectorAction/ConfigurationModal'
import match from 'ducks/transactions/actions/KonnectorAction/match'
import { KonnectorChip } from 'components/KonnectorChip'
import { findMatchingBrandWithoutTrigger } from 'ducks/brandDictionary/selectors'
import { connect } from 'react-redux'

const name = 'konnector'

const transactionDialogListItemStyle = { color: palette.dodgerBlue }
class Component extends React.Component {
  state = {
    showInformativeDialog: false,
    showIntentModal: false
  }

  showInformativeDialog = ev => {
    ev && ev.preventDefault()
    this.setState({
      showInformativeDialog: true
    })
  }

  hideInformativeDialog = ev => {
    ev && ev.preventDefault()
    this.setState({
      showInformativeDialog: false
    })
  }

  showIntentModal = ev => {
    ev && ev.preventDefault()
    this.setState({
      showIntentModal: true
    })
  }

  hideIntentModal = ev => {
    ev && ev.preventDefault()
    this.setState({
      showIntentModal: false
    })
  }

  onInformativeDialogConfirm = async () => {
    this.hideInformativeDialog()
    this.showIntentModal()
  }

  onIntentComplete = () => {
    this.props.fetchTriggers()
    this.hideIntentModal()
  }

  renderModalItem(label) {
    return (
      <ListItem
        divider
        button
        style={transactionDialogListItemStyle}
        onClick={this.showInformativeDialog}
      >
        <ListItemIcon>
          <Icon icon={IconPlus} />
        </ListItemIcon>
        <ListItemText>{label}</ListItemText>
      </ListItem>
    )
  }

  renderTransactionRow(label, brand) {
    return (
      <KonnectorChip
        onClick={this.showInformativeDialog}
        konnectorType={brand.health ? 'health' : 'generic'}
      />
    )
  }

  render() {
    const { t, isModalItem } = this.props

    const brand = this.props.brand
    if (!brand) return

    const healthOrGeneric = brand.health ? 'health' : 'generic'
    const label = t(`Transactions.actions.konnector.${healthOrGeneric}`)

    return (
      <>
        {isModalItem
          ? this.renderModalItem(label)
          : this.renderTransactionRow(label, brand)}
        {this.state.showInformativeDialog && (
          <InformativeDialog
            onCancel={this.hideInformativeDialog}
            onConfirm={this.onInformativeDialogConfirm}
            title={t(
              `Transactions.actions.informativeModal.${healthOrGeneric}.title`
            )}
            description={t(
              `Transactions.actions.informativeModal.${healthOrGeneric}.description`,
              {
                brandName: brand.name
              }
            )}
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
  client.query(cronKonnectorTriggersConn.query(client), {
    as: cronKonnectorTriggersConn.as
  })
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
    addFetchTriggers,
    connect((state, { actionProps, transaction }) => ({
      brand: findMatchingBrandWithoutTrigger(
        transaction.label,
        actionProps.brands
      )
    }))
  )(Component)
}

export default action
