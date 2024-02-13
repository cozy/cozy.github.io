import React, { useState } from 'react'
import PropTypes from 'prop-types'
import compose from 'lodash/flowRight'

import flag from 'cozy-flags'
import { translate, useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconPlus from 'cozy-ui/transpiled/react/Icons/Plus'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

import icon from 'assets/icons/actions/icon-link-out.svg'
import palette from 'cozy-ui/transpiled/react/palette'
import { konnectorTriggersConn } from 'doctypes'
import InformativeDialog from 'ducks/transactions/actions/KonnectorAction/InformativeDialog'
import ConfigurationModal from 'ducks/transactions/actions/KonnectorAction/ConfigurationModal'
import match from 'ducks/transactions/actions/KonnectorAction/match'
import { KonnectorChip } from 'components/KonnectorChip'
import { findMatchingBrandWithoutTrigger } from 'ducks/brandDictionary/selectors'
import { connect } from 'react-redux'
import { useDisableEnforceFocusModal } from 'ducks/context/DisableEnforceFocusModalContext'
import { getBrands } from 'ducks/brandDictionary'

const name = 'konnector'
const transactionDialogListItemStyle = { color: palette.dodgerBlue }

const ModalItem = ({ label, onClick }) => {
  return (
    <ListItem
      divider
      button
      style={transactionDialogListItemStyle}
      onClick={onClick}
    >
      <ListItemIcon>
        <Icon icon={IconPlus} />
      </ListItemIcon>
      <ListItemText>{label}</ListItemText>
    </ListItem>
  )
}

const TransactionRow = ({ brand, onClick }) => {
  return flag('hide.healthTheme.enabled') && brand.health ? null : (
    <KonnectorChip
      onClick={onClick}
      konnectorType={brand.health ? 'health' : 'generic'}
    />
  )
}

const Component = ({ fetchTriggers, isModalItem, transaction }) => {
  const { t } = useI18n()
  const { setDisableEnforceFocus } = useDisableEnforceFocusModal()
  const brands = getBrands()
  const brand = findMatchingBrandWithoutTrigger(transaction.label, brands)

  const [showInformativeDialogState, setShowInformativeDialogState] =
    useState(false)
  const [showIntentModalState, setShowIntentModalState] = useState(false)

  const showInformativeDialog = evt => {
    evt?.stopPropagation()
    evt?.preventDefault()
    setShowInformativeDialogState(true)
  }
  const hideInformativeDialog = evt => {
    evt?.stopPropagation()
    evt?.preventDefault()
    setShowInformativeDialogState(false)
  }
  const showIntentModal = evt => {
    evt?.stopPropagation()
    evt?.preventDefault()
    setShowIntentModalState(true)
  }
  const hideIntentModal = evt => {
    evt?.stopPropagation()
    evt?.preventDefault()
    setDisableEnforceFocus?.(false)
    setShowIntentModalState(false)
  }
  const onInformativeDialogConfirm = evt => {
    setDisableEnforceFocus?.(true)
    hideInformativeDialog()
    showIntentModal(evt)
  }
  const onIntentComplete = evt => {
    fetchTriggers()
    hideIntentModal(evt)
  }

  if (!brand) return null

  const healthOrGeneric = brand.health ? 'health' : 'generic'
  const label = t(`Transactions.actions.konnector.${healthOrGeneric}`)

  const Item = isModalItem
    ? () => <ModalItem label={label} onClick={showInformativeDialog} />
    : () => <TransactionRow brand={brand} onClick={showInformativeDialog} />

  return (
    <>
      {!brand.maintenance ? <Item /> : null}
      {showInformativeDialogState && (
        <InformativeDialog
          onCancel={hideInformativeDialog}
          onConfirm={onInformativeDialogConfirm}
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
      {showIntentModalState && (
        <ConfigurationModal
          dismissAction={hideIntentModal}
          onComplete={onIntentComplete}
          slug={brand.konnectorSlug}
        />
      )}
    </>
  )
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
  client.query(konnectorTriggersConn.query(client), {
    as: konnectorTriggersConn.as
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
    connect((_, { transaction }) => ({ transaction }))
  )(Component)
}

export default action
