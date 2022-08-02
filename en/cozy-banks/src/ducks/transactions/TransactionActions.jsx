/**
 * Is used in both TransactionActionMenu and TransactionMenu
 * to show possible actions related to a transaction.
 *
 * The TransactionAction (the action the user is most susceptible
 * to need) can also be shown in desktop mode, directly in the
 * table.
 */

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import palette from 'cozy-ui/transpiled/react/palette'
import { findMatchingActions } from 'ducks/transactions/actions'
import { TransactionActionsContext } from 'ducks/transactions/TransactionActionsContext'
import withContext from 'components/withContext'

// TODO delete or rename this variable (see https://gitlab.cozycloud.cc/labs/cozy-bank/merge_requests/237)
const PRIMARY_ACTION_COLOR = palette.dodgerBlue

const MenuAction = ({
  action,
  transaction,
  actionProps,
  compact = false,
  menuPosition,
  isModalItem
}) => {
  const { Component } = action
  const color = action.disabled
    ? palette.charcoalGrey
    : action.color || actionProps.color || PRIMARY_ACTION_COLOR

  return (
    <Component
      action={action}
      transaction={transaction}
      actionProps={actionProps}
      color={color}
      compact={compact}
      menuPosition={menuPosition}
      isModalItem={isModalItem}
    />
  )
}

MenuAction.propTypes = {
  actionProps: PropTypes.object.isRequired
}

export const SyncTransactionActions = ({
  transaction,
  actions,
  actionProps,
  displayDefaultAction,
  onlyDefault,
  menuPosition = 'left',
  isModalItem,
  compact,
  children
}) => {
  return (
    <>
      {(displayDefaultAction || onlyDefault) && actions.default && (
        <MenuAction
          action={actions.default}
          isDefault
          transaction={transaction}
          actionProps={actionProps}
          menuPosition={menuPosition}
          isModalItem={isModalItem}
          compact={compact}
        />
      )}
      {!onlyDefault &&
        actions.others.map((action, index) => (
          <MenuAction
            key={index}
            action={action}
            transaction={transaction}
            actionProps={actionProps}
            isModalItem={isModalItem}
          />
        ))}
      {children}
    </>
  )
}

class TransactionActions extends Component {
  state = {
    actions: false,
    actionProps: false
  }

  async findMatchingActions() {
    const { transaction } = this.props
    if (transaction) {
      const { bill } = this.props
      const actionProps = {
        bill,
        brands: this.props.brands,
        urls: this.props.urls
      }
      const actions = await findMatchingActions(transaction, actionProps)
      if (!this.unmounted) {
        this.setState({ actions, actionProps })
      }
    }
  }

  componentDidMount() {
    this.findMatchingActions()
  }

  componentWillUnmount() {
    this.unmounted = true
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.transaction !== this.props.transaction) {
      this.setState({ actions: false })
    }
  }

  componentDidUpdate(nextProps) {
    const { transaction, brands, urls, bill } = this.props
    if (
      nextProps.transaction !== transaction ||
      nextProps.urls !== urls ||
      nextProps.brands !== brands ||
      nextProps.bill !== bill
    ) {
      this.findMatchingActions()
    }
  }

  render() {
    const { actions, actionProps } = this.state

    if (!actions) return null

    return (
      <SyncTransactionActions
        actions={actions}
        actionProps={actionProps}
        {...this.props}
      />
    )
  }
}

TransactionActions.propTypes = {
  transaction: PropTypes.object.isRequired
}

export default withContext(TransactionActionsContext)(TransactionActions)
