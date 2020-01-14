import React from 'react'
import { translate, withBreakpoints, useI18n } from 'cozy-ui/transpiled/react'
import Icon from 'cozy-ui/transpiled/react/Icon'
import ButtonAction from 'cozy-ui/transpiled/react/ButtonAction'
import Menu, { MenuItem } from 'cozy-ui/transpiled/react/Menu'
import Badge from 'cozy-ui/transpiled/react/Badge'
import palette from 'cozy-ui/transpiled/react/palette'
import { BillComponent } from './BillAction'
import styles from 'ducks/transactions/TransactionActions.styl'
import { flowRight as compose } from 'lodash'
import TransactionModalRow from 'ducks/transactions/TransactionModalRow'

const name = 'HealthExpenseStatus'

const getVendors = transaction => {
  const reimbursements =
    transaction && transaction.reimbursements && transaction.reimbursements.data
  return reimbursements
    ? reimbursements
        .map(
          reimbursement =>
            reimbursement && reimbursement.bill && reimbursement.bill.vendor
        )
        .filter(Boolean)
    : []
}

const isPending = transaction => {
  const vendors = getVendors(transaction)
  return vendors.length === 0
}

const transactionModalRowStyle = { color: palette.pomegranate }

const Component = ({
  transaction,
  compact,
  menuPosition,
  isModalItem,
  breakpoints: { isDesktop }
}) => {
  const { t } = useI18n()
  const pending = isPending(transaction)
  const vendors = getVendors(transaction)
  const text = pending
    ? t('Transactions.actions.healthExpensePending')
    : vendors.length > 1
    ? t('Transactions.actions.healthExpenseProcessed.plural').replace(
        '%{nbReimbursements}',
        vendors.length
      )
    : t('Transactions.actions.healthExpenseProcessed.single')

  // Normally, pending color is not error/red, but for now we handle this state like this
  const type = pending ? 'error' : 'normal'
  const icon = pending ? 'hourglass' : 'file'
  const reimbursements =
    transaction.reimbursements && transaction.reimbursements.data

  if (pending) {
    if (isModalItem) {
      return (
        <TransactionModalRow
          iconLeft={<Icon icon={icon} color={palette.pomegranate} />}
          style={transactionModalRowStyle}
        >
          {text}
        </TransactionModalRow>
      )
    }

    return (
      <ButtonAction
        label={text}
        type={type}
        rightIcon={<Icon icon={icon} />}
        compact={compact}
      />
    )
  }

  if (isModalItem) {
    const items = reimbursements.map(reimbursement => {
      if (!reimbursement.bill) {
        return
      }
      return (
        <BillComponent
          key={reimbursement.bill.vendor}
          isModalItem
          t={t}
          actionProps={{
            bill: reimbursement.bill,
            text: t(`Transactions.actions.healthExpenseBill`).replace(
              '%{vendor}',
              reimbursement.bill.vendor
            )
          }}
        />
      )
    })

    return <div>{items}</div>
  }

  const rightIcon = <Icon icon={icon} width={16} />

  const enhancedRightIcon = isDesktop ? (
    rightIcon
  ) : (
    <Badge type={type} content={reimbursements.length}>
      {rightIcon}
    </Badge>
  )

  return (
    <Menu
      className={styles.TransactionActionMenu}
      position={menuPosition}
      component={
        <ButtonAction
          label={text}
          type={type}
          rightIcon={enhancedRightIcon}
          compact={compact}
          className={styles.TransactionActionButton}
        />
      }
    >
      {reimbursements.map(reimbursement => {
        if (!reimbursement.bill) {
          return
        }
        return (
          <MenuItem
            key={reimbursement.bill.vendor}
            onSelect={() => false}
            className={styles.TransactionActionMenuItem}
          >
            <BillComponent
              isMenuItem
              t={t}
              actionProps={{
                bill: reimbursement.bill,
                text: t(`Transactions.actions.healthExpenseBill`).replace(
                  '%{vendor}',
                  reimbursement.bill.vendor
                )
              }}
            />
          </MenuItem>
        )
      })}
    </Menu>
  )
}

const action = {
  name,
  color: palette.charcoalGrey,
  // eslint-disable-next-line react/display-name
  getIcon: ({ transaction }) => {
    const color = isPending(transaction)
      ? palette.pomegranate
      : palette.dodgerBlue

    return <Icon icon="hourglass" color={color} />
  },
  match: () => {
    return false
  },
  Component: compose(
    withBreakpoints(),
    translate()
  )(Component)
}

export default action
