/* global __DEV__ */

import React, { Component } from 'react'
import { get, some } from 'lodash'
import { translate } from 'cozy-ui/react'
import ButtonAction from 'cozy-ui/react/ButtonAction'
import FileOpener from 'ducks/transactions/FileOpener'
import icon from 'assets/icons/actions/icon-file.svg'
import ActionLink from 'ducks/transactions/actions/ActionLink'
import flag from 'cozy-flags'
import styles from 'ducks/transactions/TransactionActions.styl'
import TransactionModalRow from 'ducks/transactions/TransactionModalRow'
import palette from 'cozy-ui/react/palette'
import { AugmentedModalButton, isAugmentedModalTransaction } from 'ducks/demo'

const name = 'bill'

const getBillInvoice = bill => {
  if (!bill.invoice) {
    if (__DEV__) {
      console.warn('Bill without invoice', bill) // eslint-disable-line no-console
    }
    throw new Error('Bill without invoice')
  }

  const [doctype, id] = bill.invoice.split(':')

  if (!doctype || !id) {
    throw new Error('Invoice is malformed. invoice: ' + bill.invoice)
  }

  return [doctype, id]
}

const getBill = (transaction, actionProps) => {
  if (actionProps.bill) {
    return actionProps.bill
  }

  return get(transaction, 'bills.data[0]')
}

const transactionModalRowStyle = { color: palette.dodgerBlue }
export class BillComponent extends Component {
  state = {
    fileId: false
  }

  findFileId = async () => {
    const { transaction, actionProps } = this.props
    try {
      const bill = await getBill(transaction, actionProps)
      const [, fileId] = getBillInvoice(bill)
      this.setState({ fileId })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e)
    }
  }

  componentDidMount() {
    this.findFileId()
  }

  componentDidUpdate(nextProps) {
    if (nextProps.transaction !== this.props.transaction) {
      this.findFileId()
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.transaction !== this.props.transaction) {
      this.setState({ fileId: false })
    }
  }

  render() {
    const {
      t,
      transaction,
      isMenuItem = false,
      actionProps,
      compact,
      isModalItem = false
    } = this.props

    const { fileId } = this.state
    if (!fileId) {
      if (process.env.NODE_ENV === 'test') {
        return <span className="TransactionAction">Bill</span>
      } else {
        return null
      }
    }

    const text = actionProps.text || t('Transactions.actions.bill')

    if (flag('demo') && isAugmentedModalTransaction(transaction)) {
      return (
        <AugmentedModalButton
          transaction={transaction}
          compact={compact}
          fileId={fileId}
          text={text}
        />
      )
    }

    let component = null

    if (isMenuItem) {
      component = <ActionLink text={text} icon="file" />
    } else if (isModalItem) {
      component = (
        <TransactionModalRow iconLeft="file" style={transactionModalRowStyle}>
          {text}
        </TransactionModalRow>
      )
    } else {
      component = (
        <ButtonAction
          label={text}
          rightIcon="file"
          compact={compact}
          className={styles.TransactionActionButton}
        />
      )
    }

    return <FileOpener fileId={fileId}>{component}</FileOpener>
  }
}

const action = {
  name,
  icon,
  match: async (transaction, actionProps) => {
    if (flag('reimbursements.tag')) {
      return false
    }

    const bill = getBill(transaction, actionProps)
    if (bill && bill._id) {
      return !some(transaction.reimbursements, reimbursement => {
        try {
          if (reimbursement.billId) {
            const [, billId] = reimbursement.billId.split(':')
            return billId === bill._id
          }
          // eslint-disable-next-line no-empty
        } catch (e) {}
        return false
      })
    }
    return false
  },
  Component: translate()(BillComponent)
}

export default action
