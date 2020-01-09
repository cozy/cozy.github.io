import React from 'react'
import { connect } from 'react-redux'
import Icon from 'cozy-ui/transpiled/react/Icon'
import Chip from 'cozy-ui/transpiled/react/Chip'
import Alerter from 'cozy-ui/transpiled/react/Alerter'
import {
  getReimbursementStatus,
  isReimbursementLate,
  REIMBURSEMENTS_STATUS
} from 'ducks/transactions/helpers'
import TransactionModalRow, {
  RowArrow
} from 'ducks/transactions/TransactionModalRow'
import ReimbursementStatusModal from 'ducks/transactions/actions/ReimbursementStatusAction/ReimbursementStatusModal'
import iconReimbursement from 'assets/icons/icon-reimbursement.svg'
import { logException } from 'lib/sentry'
import cx from 'classnames'
import { translate } from 'cozy-ui/transpiled/react'
import { flowRight as compose } from 'lodash'
import { withMutations } from 'cozy-client'
import { getHealthReimbursementLateLimitSelector } from 'ducks/reimbursements/selectors'

export class DumbReimbursementStatusAction extends React.PureComponent {
  state = {
    showModal: false
  }

  showModal = () => this.setState({ showModal: true })
  hideModal = () => this.setState({ showModal: false })

  handleChange = async e => {
    const { transaction, saveDocument, t } = this.props
    transaction.reimbursementStatus = e.target.value

    this.hideModal()

    try {
      await saveDocument(transaction)
    } catch (err) {
      logException(err)
      Alerter.error(t('Transactions.reimbursementStatusUpdateError'))
    }
  }

  renderModalItem() {
    const { t, transaction, healthReimbursementLateLimit } = this.props

    const status = getReimbursementStatus(transaction)
    const isLate = isReimbursementLate(
      transaction,
      healthReimbursementLateLimit
    )
    const translateKey = isLate ? 'late' : status
    const label = t(`Transactions.actions.reimbursementStatus.${translateKey}`)

    return (
      <TransactionModalRow
        iconLeft={<Icon icon={iconReimbursement} />}
        iconRight={<RowArrow />}
        onClick={this.showModal}
      >
        {label}
      </TransactionModalRow>
    )
  }

  renderTransactionRow() {
    const { transaction, t, healthReimbursementLateLimit } = this.props

    const status = getReimbursementStatus(transaction)
    const isLate = isReimbursementLate(
      transaction,
      healthReimbursementLateLimit
    )

    if (status === REIMBURSEMENTS_STATUS.noReimbursement) {
      return null
    }

    const translateKey = isLate ? 'late' : status

    return (
      <Chip
        size="small"
        variant="outlined"
        theme={isLate ? 'error' : 'normal'}
        onClick={this.showModal}
        className={cx({ 'u-valid': status === 'reimbursed' })}
      >
        {t(`Transactions.actions.reimbursementStatus.${translateKey}`)}
        {status === 'pending' && (
          <>
            <Chip.Separator />
            <Icon icon="hourglass" size={12} />
          </>
        )}
      </Chip>
    )
  }

  render() {
    const { isModalItem, transaction } = this.props

    return (
      <>
        {isModalItem ? this.renderModalItem() : this.renderTransactionRow()}
        {this.state.showModal && (
          <ReimbursementStatusModal
            into="body"
            dismissAction={this.hideModal}
            mobileFullscreen
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
  withMutations(),
  connect(state => ({
    healthReimbursementLateLimit: getHealthReimbursementLateLimitSelector(state)
  }))
)(DumbReimbursementStatusAction)

export default ReimbursementStatusAction
