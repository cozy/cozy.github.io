import React from 'react'
import {
  hasBills,
  getBills,
  hasReimbursements,
  getReimbursementsBills
} from 'ducks/transactions/helpers'
import BillChip from 'ducks/transactions/actions/AttachedDocsAction/BillChip'
import iconAttachment from 'assets/icons/icon-attachment.svg'
import uniqBy from 'lodash/uniqBy'
import Icon from 'cozy-ui/transpiled/react/Icon'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

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
      <ListItem divider alignItems="flex-start">
        <ListItemIcon>
          <Icon icon={<AttachmentIcon />} />
        </ListItemIcon>
        <ListItemText>
          {hasBills(transaction) && this.renderModalItemBills()}
          {hasReimbursements(transaction) &&
            this.renderModalItemReimbursements()}
        </ListItemText>
      </ListItem>
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
    return hasBills(transaction) || hasReimbursements(transaction)
  },
  Component: AttachedDocsAction
}

export default action
