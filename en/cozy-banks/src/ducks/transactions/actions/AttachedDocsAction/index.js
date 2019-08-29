import React from 'react'
import flag from 'cozy-flags'
import {
  hasBills,
  getBills,
  hasReimbursements,
  getReimbursementsBills
} from 'ducks/transactions/helpers'
import BillChip from 'ducks/transactions/actions/AttachedDocsAction/BillChip'
import { TransactionModalRow } from 'ducks/transactions/TransactionModal'
import iconAttachment from 'assets/icons/icon-attachment.svg'
import { uniqBy } from 'lodash'

class AttachedDocsAction extends React.PureComponent {
  renderTransactionRow() {
    const { transaction } = this.props

    const bills = uniqBy([
      ...getBills(transaction),
      ...getReimbursementsBills(transaction)
    ])

    return bills.map(bill => <BillChip bill={bill} key={bill._id} />)
  }

  renderModalItem() {
    const { transaction } = this.props

    return (
      <TransactionModalRow iconLeft={iconAttachment} align="top">
        {hasBills(transaction) && this.renderModalItemBills()}
        {hasReimbursements(transaction) && this.renderModalItemReimbursements()}
      </TransactionModalRow>
    )
  }

  renderModalItemBills() {
    const { transaction } = this.props
    const bills = getBills(transaction)

    return bills.map(bill => (
      <TransactionModalRow key={bill._id}>
        <BillChip bill={bill} />
      </TransactionModalRow>
    ))
  }

  renderModalItemReimbursements() {
    const { transaction } = this.props
    const bills = getReimbursementsBills(transaction)

    return bills.map(bill => (
      <TransactionModalRow key={bill._id}>
        <BillChip bill={bill} />
      </TransactionModalRow>
    ))
  }

  render() {
    const { isModalItem } = this.props

    if (isModalItem) {
      return this.renderModalItem()
    } else {
      return this.renderTransactionRow()
    }
  }
}

const action = {
  name: 'AttachedDocs',
  match: transaction => {
    return (
      flag('reimbursement-tag') &&
      (hasBills(transaction) || hasReimbursements(transaction))
    )
  },
  Component: AttachedDocsAction
}

export default action
