import React from 'react'
import compose from 'lodash/flowRight'
import { withRouter } from 'react-router'
import Padded from 'components/Spacing/Padded'
import { translate, Text, Modal, useI18n } from 'cozy-ui/transpiled/react'
import { withClient, queryConnect } from 'cozy-client'
import Realtime from 'cozy-realtime'
import { logException } from 'lib/sentry'
import { recipientsConn, accountsConn } from 'doctypes'

import Loading from 'components/Loading'
import Stepper from 'components/Stepper'
import AddAccountButton from 'ducks/categories/AddAccountButton'
import * as recipientUtils from 'ducks/transfers/recipients'
import * as transfers from 'ducks/transfers/transfers'

import Title from 'ducks/transfers/steps/Title'
import {
  TransferSuccess,
  TransferError
} from 'ducks/transfers/steps/TransferState'
import ChooseRecipientCategory from 'ducks/transfers/steps/Category'
import ChooseBeneficiary from 'ducks/transfers/steps/Beneficiary'
import ChooseSenderAccount from 'ducks/transfers/steps/Sender'
import ChooseAmount from 'ducks/transfers/steps/Amount'
import Summary from 'ducks/transfers/steps/Summary'
import Password from 'ducks/transfers/steps/Password'
import { isLoginFailed } from 'ducks/transfers/utils'
import BarTheme from 'ducks/bar/BarTheme'
import { isCollectionLoading, hasBeenLoaded } from 'ducks/client/utils'

const THIRTY_SECONDS = 30 * 1000

const slideIndexes = {
  category: 0,
  beneficiary: 1,
  sender: 2,
  amount: 3,
  summary: 4,
  password: 5
}

const subscribe = (rt, event, doc, id, cb) => {
  let handler
  const unsubscribe = () => {
    rt.unsubscribe(event, doc, id, handler)
  }
  handler = doc => {
    return cb(doc, unsubscribe)
  }
  rt.subscribe(event, doc, id, handler)
  return unsubscribe
}

const NoRecipient = () => {
  const { t } = useI18n()

  return (
    <Padded>
      <Title>{t('Transfer.no-recipients.title')}</Title>
      <Text>{t('Transfer.no-recipients.description')}</Text>
      <ul>
        <li>Axa Banque</li>
        <li>BNP Paribas</li>
        <li>Boursorama</li>
        <li>Banque Postale Particuliers</li>
        <li>CIC</li>
        <li>Crédit Agricole</li>
        <li>Crédit Coopératif</li>
        <li>Crédit Foncier</li>
        <li>Crédit Mutuel</li>
        <li>Fortuneo</li>
        <li>Hello Bank</li>
        <li>ING</li>
        <li>LCL</li>
        <li>Société Générale</li>
      </ul>
      <AddAccountButton
        extension="full"
        label={t('Transfer.no-bank.add-bank')}
        theme="primary"
        className="u-mt-0"
      />
    </Padded>
  )
}

const NoBank = () => {
  const { t } = useI18n()

  return (
    <Padded>
      <Title>{t('Transfer.no-bank.title')}</Title>
      <AddAccountButton
        absolute
        extension="full"
        label={t('Transfer.no-bank.add-bank')}
        theme="primary"
        className="u-mt-0"
      />
    </Padded>
  )
}

class TransferPage extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.state = this.getInitialState()
    this.handleGoBack = this.handleGoBack.bind(this)
    this.handleChangeCategory = this.handleChangeCategory.bind(this)
    this.handleSelectBeneficiary = this.handleSelectBeneficiary.bind(this)
    this.handleChangeAmount = this.handleChangeAmount.bind(this)
    this.handleSelectAmount = this.handleSelectAmount.bind(this)
    this.handleSelectSender = this.handleSelectSender.bind(this)
    this.handleSelectSlide = this.handleSelectSlide.bind(this)
    this.handleConfirmSummary = this.handleConfirmSummary.bind(this)
    this.handleChangePassword = this.handleChangePassword.bind(this)
    this.handleChangeLabel = this.handleChangeLabel.bind(this)
    this.handleChangeDate = this.handleChangeDate.bind(this)
    this.handleConfirm = this.handleConfirm.bind(this)
    this.handleModalDismiss = this.handleModalDismiss.bind(this)
    this.handleJobChange = this.handleJobChange.bind(this)
    this.handleExit = this.handleExit.bind(this)
    this.handleReset = this.handleReset.bind(this)
  }

  getInitialState() {
    return {
      category: null, // Currently selected category
      slide: 0,
      transferState: null,
      senderAccount: null,
      senderAccounts: [], // Possible sender accounts for chosen person
      amount: '',
      password: '',
      label: '',
      date: new Date().toISOString().slice(0, 10)
    }
  }

  handleConfirm() {
    this.transferMoney()
  }

  followJob(job) {
    const rt = new Realtime({ client: this.props.client })
    this.unfollowJob = subscribe(
      rt,
      'updated',
      'io.cozy.jobs',
      job._id,
      this.handleJobChange
    )
  }

  componentDidUpdate(prevProps) {
    this.ensureHasAllRecipients()
    this.checkToUpdateSlideBasedOnRoute(prevProps)
  }

  ensureHasAllRecipients() {
    if (
      this.props.recipients.hasMore &&
      this.props.recipients.fetchStatus !== 'loading'
    ) {
      this.props.recipients.fetchMore()
    }
  }

  checkToUpdateSlideBasedOnRoute(prevProps) {
    if (!this.props.router) {
      // In tests when TransferPage is not wrapped in withRouter
      return
    }
    const { routeParams: prevRouteParams } = prevProps
    const { routeParams } = this.props
    if (routeParams.slideName !== prevRouteParams.slideName) {
      this.selectSlideByName(routeParams.slideName)
    }
  }

  handleJobChange(job, unsubscribe) {
    if (job.state === 'done') {
      this.setState({ transferState: 'success' })
      unsubscribe()
      clearTimeout(this.successTimeout)
    } else if (job.state === 'errored') {
      this.setState({ transferState: new Error(job.error) })
      unsubscribe()
      clearTimeout(this.successTimeout)
    }
  }

  async transferMoney() {
    const { client } = this.props
    const {
      amount,
      beneficiary,
      senderAccount,
      password,
      label,
      date
    } = this.state

    this.setState({
      transferState: 'sending'
    })
    try {
      const recipient = beneficiary.recipients.find(
        rec => rec.vendorAccountId == senderAccount.vendorId
      )
      const job = await transfers.createJob(client, {
        amount: amount,
        recipientId: recipient._id,
        senderAccount,
        password: password,
        label,
        executionDate: date
      })
      this.followJob(job)
      this.successTimeout = setTimeout(() => {
        this.setState({
          transferState: 'success'
        })
      }, THIRTY_SECONDS)
    } catch (e) {
      console.error(e) // eslint-disable-line no-console
      if (!isLoginFailed(e)) {
        logException(e)
      }
      this.setState({ transferState: e })
    }
  }

  componentWillUnmount() {
    clearTimeout(this.successTimeout)
    this.unfollowJob && this.unfollowJob()
  }

  handleGoBack() {
    this.goToPrevious()
  }

  goToPrevious() {
    this.setState({ slide: Math.max(this.state.slide - 1, 0) })
  }

  handleChangeCategory(category) {
    this.setState({ category })
    this.selectSlideByName('beneficiary')
  }

  handleSelectBeneficiary(beneficiary) {
    const possibleSenderAccounts = new Set(
      beneficiary.recipients.map(x => x.vendorAccountId + '')
    )

    const data = this.props.accounts.data
    const senderAccounts = data.filter(x =>
      possibleSenderAccounts.has(x.vendorId)
    )
    this.setState({
      beneficiary,
      senderAccounts,
      senderAccount: senderAccounts[0]
    })
    this.selectSlideByName('sender')
  }

  handleChangeAmount(amount) {
    this.setState({ amount: amount })
  }

  handleSelectSender(senderAccount) {
    this.setState({ senderAccount })
    this.selectSlideByName('amount')
  }

  handleSelectAmount() {
    this.selectSlideByName('summary')
  }

  handleConfirmSummary() {
    this.selectSlideByName('password')
  }

  handleChangePassword(ev) {
    this.setState({ password: ev.target.value })
  }

  handleChangeLabel(ev) {
    this.setState({ label: ev.target.value })
  }

  handleChangeDate(ev) {
    this.setState({ date: ev.target.value })
  }

  handleSelectSlide(slideName) {
    this.selectSlideByName(slideName)
  }

  selectSlideByName(slideName) {
    this.setState({ slide: slideIndexes[slideName] || 0 })
    this.props.router.push(slideName ? `/transfers/${slideName}` : '/transfers')
  }

  handleModalDismiss() {
    this.handleReset()
  }

  handleReset() {
    this.setState(this.getInitialState())
    clearTimeout(this.successTimeout)
  }

  handleExit() {
    const { transferState } = this.state
    if (isLoginFailed(transferState)) {
      this.selectSlideByName('password')
      this.setState({ password: '', transferState: null })
    } else {
      this.props.router.push('/')
    }
  }

  render() {
    const { recipients, accounts } = this.props

    const {
      category,
      beneficiary,
      senderAccount,
      senderAccounts,
      amount,
      transferState,
      password,
      label,
      date
    } = this.state

    if (
      (isCollectionLoading(recipients) && !hasBeenLoaded(recipients)) ||
      (isCollectionLoading(accounts) && !hasBeenLoaded(accounts))
    ) {
      return (
        <Padded>
          <Loading />
        </Padded>
      )
    }

    if (accounts.data.length === 0) {
      return <NoBank />
    }

    if (recipients.data.length === 0) {
      return <NoRecipient />
    }

    const categoryFilter = recipientUtils.createCategoryFilter(
      category,
      accounts.data
    )
    const beneficiaries = recipientUtils.groupAsBeneficiary(
      recipients.data.filter(categoryFilter),
      accounts.data
    )

    return (
      <>
        {transferState !== null ? (
          <Modal mobileFullscreen dismissAction={this.handleModalDismiss}>
            {transferState === 'sending' && <Loading />}
            {transferState === 'success' && (
              <TransferSuccess onExit={this.handleExit} />
            )}
            {transferState instanceof Error && (
              <TransferError error={transferState} onExit={this.handleExit} />
            )}
          </Modal>
        ) : null}
        <Stepper currentIndex={this.state.slide} onBack={this.handleGoBack}>
          <ChooseRecipientCategory
            category={category}
            onSelect={this.handleChangeCategory}
          />
          <ChooseBeneficiary
            category={category}
            beneficiary={beneficiary}
            onSelect={this.handleSelectBeneficiary}
            beneficiaries={beneficiaries}
          />
          <ChooseSenderAccount
            account={senderAccount}
            accounts={senderAccounts}
            onSelect={this.handleSelectSender}
          />
          <ChooseAmount
            amount={amount}
            onChange={this.handleChangeAmount}
            onSelect={this.handleSelectAmount}
          />
          <Summary
            onConfirm={this.handleConfirmSummary}
            amount={amount}
            beneficiary={beneficiary}
            senderAccount={senderAccount}
            selectSlide={this.handleSelectSlide}
            onChangeLabel={this.handleChangeLabel}
            onChangeDate={this.handleChangeDate}
            label={label}
            date={date}
          />
          <Password
            onChangePassword={this.handleChangePassword}
            onConfirm={this.handleConfirm}
            password={password}
            senderAccount={senderAccount}
          />
        </Stepper>
      </>
    )
  }
}

const barTheme = theme => Component => props => {
  return (
    <>
      <BarTheme theme={theme} />
      <Component {...props} />
    </>
  )
}

const enhance = compose(
  barTheme('primary'),
  withClient,
  withRouter,
  queryConnect({
    accounts: accountsConn,
    recipients: recipientsConn
  }),
  translate()
)

export { TransferPage }

export default enhance(TransferPage)
