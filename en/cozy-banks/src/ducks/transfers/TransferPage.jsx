import React from 'react'
import compose from 'lodash/flowRight'
import get from 'lodash/get'
import { withRouter } from 'react-router'

import withBreakpoints from 'cozy-ui/transpiled/react/helpers/withBreakpoints'
import Stack from 'cozy-ui/transpiled/react/Stack'
import { translate, Text, Modal, useI18n } from 'cozy-ui/transpiled/react'
import { withClient, queryConnect } from 'cozy-client'
import { utils } from 'cozy-client/dist/models'
import Realtime from 'cozy-realtime'
import flag from 'cozy-flags'
import pickBy from 'lodash/pickBy'

import { logException } from 'lib/sentry'
import { recipientsConn, accountsConn, myselfConn } from 'doctypes'

import Padded from 'components/Spacing/Padded'
import Loading from 'components/Loading'
import Stepper from 'components/Stepper'
import PageTitle from 'components/Title/PageTitle'

import AddAccountButton from 'ducks/categories/AddAccountButton'
import * as recipientUtils from 'ducks/transfers/recipients'
import * as transfers from 'ducks/transfers/transfers'

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
import { PersonalInfoModal, PersonalInfoPage } from 'ducks/personal-info'
import manifest from 'ducks/client/manifest'

const THIRTY_SECONDS = 30 * 1000

const slideIndexes = [
  'category',
  'beneficiary',
  'sender',
  'amount',
  'summary',
  'password'
]

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
      <Stack spacing="l">
        <PageTitle>{t('Transfer.no-recipients.title')}</PageTitle>
        <Text className="u-maw-7">
          {t('Transfer.no-recipients.description')}
        </Text>
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
      </Stack>
    </Padded>
  )
}

const NoBank = () => {
  const { t } = useI18n()

  return (
    <Padded>
      <PageTitle>{t('Transfer.no-bank.title')}</PageTitle>
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

const isMyselfSufficientlyFilled = myself => {
  return (
    myself.birthcity &&
    myself.birthcity !== '' &&
    myself.nationality &&
    myself.nationality !== '' &&
    utils.hasBeenUpdatedByApp(myself, manifest.slug)
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
    this.handleConfirmAdditionalInfo = this.handleConfirmAdditionalInfo.bind(
      this
    )
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
      transferState: flag('banks.transfers.mock-state'),
      senderAccount: null,
      senderAccounts: [], // Possible sender accounts for chosen person
      amount: '',
      password: '',
      label: '',
      date: new Date().toISOString().slice(0, 10),
      showingPersonalInfo:
        get(this.props, 'myself.data[0]') &&
        !isMyselfSufficientlyFilled(this.props.myself.data[0])
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
    this.checkToShowPersonalInfoModal(prevProps)
    this.checkToUpdateSlideBasedOnRoute(prevProps)
  }

  /**
   * If the info contained in the myself contact is not sufficient,
   * the personal info modal/page will be shown
   */
  checkToShowPersonalInfoModal(prevProps) {
    const props = this.props

    const prevMyself = get(prevProps.myself, 'data[0]')
    const nowMyself = get(props.myself, 'data[0]')
    if (prevMyself !== nowMyself) {
      if (
        isMyselfSufficientlyFilled(nowMyself) &&
        !flag('banks.transfers.display-personal-info-form')
      ) {
        this.setState({
          showingPersonalInfo: false
        })
      } else {
        this.setState({
          showingPersonalInfo: true
        })
      }
    }
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

  handleConfirmAdditionalInfo() {
    this.selectSlideByName('category')
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
    const idx = slideIndexes.findIndex(x => x == slideName)
    this.setState({ slide: idx !== -1 ? idx : 0 })
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
    const { recipients, accounts, myself } = this.props

    const {
      category,
      beneficiary,
      senderAccount,
      senderAccounts,
      amount,
      transferState,
      password,
      label,
      date,
      showingPersonalInfo
    } = this.state

    if (
      (isCollectionLoading(recipients) && !hasBeenLoaded(recipients)) ||
      (isCollectionLoading(accounts) && !hasBeenLoaded(accounts)) ||
      (myself && (isCollectionLoading(myself) && !hasBeenLoaded(myself)))
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

    const { isMobile } = this.props.breakpoints
    const PersonalInfoComponent = isMobile
      ? PersonalInfoPage
      : PersonalInfoModal
    const personalInfoWrapperProps = isMobile ? null : { closable: false }

    return (
      <>
        {transferState ? (
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
        {showingPersonalInfo ? (
          <PersonalInfoComponent
            onSaveSuccessful={updatedMyself => {
              if (isMyselfSufficientlyFilled(updatedMyself)) {
                this.setState({ showingPersonalInfo: false })
              }
            }}
            wrapperProps={personalInfoWrapperProps}
          />
        ) : null}
        {!showingPersonalInfo || !isMobile ? (
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
        ) : null}
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

const removeFalsyProperties = pickBy
const enhance = compose(
  barTheme('primary'),
  withClient,
  withRouter,
  withBreakpoints(),
  queryConnect(
    removeFalsyProperties({
      accounts: accountsConn,
      recipients: recipientsConn,
      myself: flag('banks.transfers.need-personal-information')
        ? myselfConn
        : null
    })
  ),
  translate()
)

export { TransferPage }

export default enhance(TransferPage)
