import React from 'react'
// import { some } from 'lodash'
import { useI18n } from 'cozy-ui/transpiled/react'
import icon from 'assets/icons/actions/icon-file.svg'
import { BillComponent } from 'ducks/transactions/actions/BillAction'

const name = 'healthExpenseBill'

export const Component = ({
  transaction,
  actionProps,
  compact,
  isModalItem
}) => {
  const { t } = useI18n()
  return (
    <span>
      {transaction.reimbursements.data.map((reimbursement, index) => {
        if (!reimbursement.bill) {
          return
        }
        return (
          <BillComponent
            key={index}
            t={t}
            actionProps={{
              ...actionProps,
              bill: reimbursement.bill,
              text: t(`Transactions.actions.${name}`).replace(
                '%{vendor}',
                reimbursement.bill.vendor
              )
            }}
            compact={compact}
            isModalItem={isModalItem}
          />
        )
      })}
    </span>
  )
}

const action = {
  name,
  icon,
  defaultAction: false,
  // match: transaction =>
  //   some(transaction.reimbursements, reimbursement => reimbursement.bill),
  match: () => false, // We temporary need to hide these actions
  Component: Component
}

export default action
