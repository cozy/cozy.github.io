import React from 'react'
import { connect } from 'react-redux'

import Icon from 'cozy-ui/transpiled/react/Icon'
import Chip from 'cozy-ui/transpiled/react/deprecated/Chip'
import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'
import { useI18n, translate } from 'cozy-ui/transpiled/react/providers/I18n'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

import {
  getReimbursementStatus,
  isReimbursementLate,
  REIMBURSEMENTS_STATUS
} from 'ducks/transactions/helpers'
import ListItemArrow from 'components/ListItemArrow'

import ReimbursementStatusModal from 'ducks/transactions/actions/ReimbursementStatusAction/ReimbursementStatusModal'
import { trackEvent } from 'ducks/tracking/browser'

import iconReimbursement from 'assets/icons/icon-reimbursement.svg'
import logger from 'lib/logger'
import cx from 'classnames'
import compose from 'lodash/flowRight'
import { withClient } from 'cozy-client'
import { getHealthReimbursementLateLimitSelector } from 'ducks/reimbursements/selectors'

import HourglassIcon from 'cozy-ui/transpiled/react/Icons/Hourglass'

const TransactionItem = ({
  transaction,
  healthReimbursementLateLimit,
  onClick
}) => {
  const { t } = useI18n()
  const status = getReimbursementStatus(transaction)
  const isLate = isReimbursementLate(transaction, healthReimbursementLateLimit)

  if (status === REIMBURSEMENTS_STATUS.noReimbursement) {
    return null
  }

  const translateKey = isLate ? 'late' : status

  return (
    <Chip
      size="small"
      variant="outlined"
      theme={isLate ? 'error' : 'normal'}
      onClick={onClick}
      className={cx({ 'u-success': status === 'reimbursed' })}
    >
      {t(`Transactions.actions.reimbursementStatus.${translateKey}`)}
      {status === 'pending' && (
        <>
          <Chip.Separator />
          <Icon icon={HourglassIcon} size={12} />
        </>
      )}
    </Chip>
  )
}

const ModalItem = ({ transaction, healthReimbursementLateLimit, onClick }) => {
  const { t } = useI18n()

  const status = getReimbursementStatus(transaction)
  const isLate = isReimbursementLate(transaction, healthReimbursementLateLimit)
  const translateKey = isLate ? 'late' : status
  const label = t(`Transactions.actions.reimbursementStatus.${translateKey}`)

  return (
    <ListItem divider button disableRipple onClick={onClick}>
      <ListItemIcon>
        <Icon icon={iconReimbursement} />
      </ListItemIcon>
      <ListItemText>{label}</ListItemText>
      <ListItemArrow />
    </ListItem>
  )
}

const reimbursementStatusToEventName = {
  pending: 'attente_remboursement',
  reimbursed: 'rembourse',
  'no-reimbursement': 'pas_attente_remboursement '
}

export class DumbReimbursementStatusAction extends React.PureComponent {
  state = {
    showModal: false
  }

  showModal = evt => {
    evt?.stopPropagation()
    evt?.preventDefault()
    this.setState({ showModal: true })
  }

  hideModal = evt => {
    evt?.stopPropagation()
    evt?.preventDefault()
    this.setState({ showModal: false })
  }

  handleChange = async (evt, value) => {
    evt?.stopPropagation()
    const { transaction, client, t } = this.props
    transaction.reimbursementStatus = value

    this.hideModal(evt)

    try {
      await client.save(transaction)
    } catch (err) {
      logger.error(err)
      Alerter.error(t('Transactions.reimbursementStatusUpdateError'))
    }

    trackEvent({
      name: reimbursementStatusToEventName[value]
    })
  }

  render() {
    const { isModalItem, transaction, healthReimbursementLateLimit } =
      this.props

    const Item = isModalItem ? ModalItem : TransactionItem
    return (
      <>
        <Item
          transaction={transaction}
          healthReimbursementLateLimit={healthReimbursementLateLimit}
          onClick={this.showModal}
        />
        {this.state.showModal && (
          <ReimbursementStatusModal
            onClose={this.hideModal}
            transaction={transaction}
            onChange={this.handleChange}
            brands={this.props.actionProps.brands}
          />
        )}
      </>
    )
  }
}

const ReimbursementStatusAction = compose(
  translate(),
  withClient,
  connect(state => ({
    healthReimbursementLateLimit: getHealthReimbursementLateLimitSelector(state)
  }))
)(DumbReimbursementStatusAction)

export default ReimbursementStatusAction
