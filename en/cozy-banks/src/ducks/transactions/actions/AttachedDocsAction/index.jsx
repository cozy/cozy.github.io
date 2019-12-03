import React from 'react'
import flag from 'cozy-flags'
import {
  hasBills,
  getBills,
  hasReimbursements,
  getReimbursementsBills
} from 'ducks/transactions/helpers'
import BillChip from 'ducks/transactions/actions/AttachedDocsAction/BillChip'
import TransactionModalRow from 'ducks/transactions/TransactionModalRow'
import iconAttachment from 'assets/icons/icon-attachment.svg'
import { uniqBy } from 'lodash'
import { Icon } from 'cozy-ui/transpiled/react'

const AttachmentIcon = () => (
  <div className="u-mt-half">
    <Icon icon={iconAttachment} />
  </div>
)

class AttachedDocsAction extends React.PureComponent {
  renderTransactionRow() {
    const { transaction } = this.props

    const bills = uniqBy([
      ...getBills(transaction),
      ...getReimbursementsBills(transaction)
    ])

    return bills.map(bill => (
      <BillChip transaction={transaction} bill={bill} key={bill._id} />
    ))
  }

  renderModalItem() {
    const { transaction } = this.props

    return (
      <TransactionModalRow align="top" iconLeft={<AttachmentIcon />}>
        {hasBills(transaction) && this.renderModalItemBills()}
        {hasReimbursements(transaction) && this.renderModalItemReimbursements()}
      </TransactionModalRow>
    )
  }

  renderModalItemBills() {
    const { transaction } = this.props
    const bills = getBills(transaction)

    return bills.map(bill => (
      <BillChip key={bill._id} bill={bill} transaction={transaction} />
    ))
  }

  renderModalItemReimbursements() {
    const { transaction } = this.props
    const bills = getReimbursementsBills(transaction)

    return bills.map(bill => (
      <BillChip key={bill._id} bill={bill} transaction={transaction} />
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
      flag('reimbursements.tag') &&
      (hasBills(transaction) || hasReimbursements(transaction))
    )
  },
  Component: AttachedDocsAction
}

export default action
