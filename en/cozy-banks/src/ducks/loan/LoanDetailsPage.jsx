import React from 'react'
import { BalanceDetailsHeader } from 'ducks/balance'
import { translate } from 'cozy-ui/transpiled/react/I18n'
import withBreakpoints from 'cozy-ui/transpiled/react/helpers/withBreakpoints'
import CompositeRow from 'cozy-ui/transpiled/react/CompositeRow'
import NarrowContent from 'cozy-ui/transpiled/react/NarrowContent'
import { Figure } from 'components/Figure'
import { get } from 'lodash'
import { Section as BaseSection } from 'components/Section'
import cx from 'classnames'
import styles from 'ducks/loan/LoanDetailsPage.styl'
import LoanProgress from 'ducks/loan/LoanProgress'
import { Padded } from 'components/Spacing'
import { flowRight as compose } from 'lodash'

const DATE_FORMAT = 'DD/MM/YY'

const DumbRow = props => {
  const {
    type,
    title,
    value: originalValue,
    caption,
    t, // eslint-disable-line no-unused-vars
    f,
    className,
    breakpoints: { isMobile },
    ...rest
  } = props

  if (!originalValue) {
    return null
  }

  let value

  switch (type) {
    case 'amount':
      value = <Figure total={originalValue} symbol="€" />
      break

    case 'date':
      value = f(originalValue, DATE_FORMAT)
      break

    case 'rate':
      value = originalValue + '%'
      break

    case 'nb-payments':
      value = 'x' + originalValue
      break

    default:
      value = originalValue
      break
  }

  const right = <span className={styles.LoanDetailsRow__value}>{value}</span>

  return (
    <div className={cx(styles.LoanDetailsRow, className)}>
      <NarrowContent>
        <CompositeRow
          className={cx({
            'u-pl-2': !isMobile
          })}
          primaryText={title}
          secondaryText={caption}
          right={right}
          {...rest}
        />
      </NarrowContent>
    </div>
  )
}

const Row = compose(
  translate(),
  withBreakpoints()
)(DumbRow)

const Section = props => {
  const { title, children } = props

  return <BaseSection title={title}>{children}</BaseSection>
}

const hasSomeInfos = (account, paths) => {
  for (const path of paths) {
    if (get(account, path)) {
      return true
    }
  }

  return false
}

const KeyInfosSection = translate()(props => {
  const { account, t } = props

  const shouldRender = hasSomeInfos(account, [
    'loan.usedAmount',
    'balance',
    'loan.rate'
  ])

  if (!shouldRender) {
    return null
  }

  return (
    <Section title={t('LoanDetails.keyInfos.title')}>
      <Row
        type="amount"
        title={t('LoanDetails.keyInfos.borrowedAmount')}
        value={get(account, 'loan.usedAmount')}
      />
      <Row
        type="amount"
        title={t('LoanDetails.keyInfos.remainingCapital')}
        value={-get(account, 'balance')}
      />
      <Row
        type="rate"
        title={t('LoanDetails.keyInfos.interestRate')}
        value={get(account, 'loan.rate')}
      />
    </Section>
  )
})

const PaymentsSection = translate()(props => {
  const { account, t, f } = props

  const shouldRender = hasSomeInfos(account, [
    'loan.lastPaymentDate',
    'loan.nextPaymentDate'
  ])

  if (!shouldRender) {
    return null
  }

  return (
    <Section title={t('LoanDetails.payments.title')}>
      <Row
        type="amount"
        title={t('LoanDetails.payments.lastPayment')}
        value={get(account, 'loan.lastPaymentAmount')}
        caption={
          t('LoanDetails.dateGlue') +
          ' ' +
          f(get(account, 'loan.lastPaymentDate'), DATE_FORMAT)
        }
      />
      <Row
        type="amount"
        title={t('LoanDetails.payments.nextPayment')}
        value={get(account, 'loan.nextPaymentAmount')}
        caption={
          t('LoanDetails.dateGlue') +
          ' ' +
          f(get(account, 'loan.nextPaymentDate'), DATE_FORMAT)
        }
      />
    </Section>
  )
})

const CharacteristicsSection = translate()(props => {
  const { account, t } = props

  const shouldRender = hasSomeInfos(account, [
    'loan.subscriptionDate',
    'loan.maturityDate',
    'loan.nbPaymentsLeft',
    'loan.nbPaymentsDone'
  ])

  if (!shouldRender) {
    return null
  }

  return (
    <Section title={t('LoanDetails.characteristics.title')}>
      <Row
        type="date"
        title={t('LoanDetails.characteristics.subscriptionDate')}
        value={get(account, 'loan.subscriptionDate')}
      />
      <Row
        type="date"
        title={t('LoanDetails.characteristics.maturityDate')}
        value={get(account, 'loan.maturityDate')}
      />
      <Row
        type="nb-payments"
        title={t('LoanDetails.characteristics.nbPaymentsLeft')}
        value={get(account, 'loan.nbPaymentsLeft')}
      />
      <Row
        type="nb-payments"
        title={t('LoanDetails.characteristics.nbPaymentsDone')}
        value={get(account, 'loan.nbPaymentsDone')}
      />
    </Section>
  )
})

const CreditReserveSection = translate()(props => {
  const { account, t } = props

  const shouldRender = hasSomeInfos(account, [
    'loan.totalAmount',
    'loan.availableAmount'
  ])

  if (!shouldRender) {
    return null
  }

  return (
    <Section title={t('LoanDetails.creditReserve.title')}>
      <Row
        type="amount"
        title={t('LoanDetails.creditReserve.totalUsedAmount')}
        value={get(account, 'loan.totalAmount')}
      />
      <Row
        type="amount"
        title={t('LoanDetails.creditReserve.availableAmount')}
        value={get(account, 'loan.availableAmount')}
      />
    </Section>
  )
})

const DumbLoanDetails = props => {
  const { account } = props

  return (
    <>
      <KeyInfosSection account={account} />
      <PaymentsSection account={account} />
      <CharacteristicsSection account={account} />
      <CreditReserveSection account={account} />
    </>
  )
}

const LoanDetails = translate()(DumbLoanDetails)

export const DumbLoanDetailsPage = props => {
  const {
    filteringDoc: account,
    breakpoints: { isMobile }
  } = props

  return (
    <>
      <BalanceDetailsHeader showBalance />
      <BaseSection>
        <NarrowContent>
          <Padded className={cx({ 'u-pr-1': !isMobile })}>
            <LoanProgress account={account} />
          </Padded>
        </NarrowContent>
      </BaseSection>
      <LoanDetails account={account} />
    </>
  )
}

const LoanDetailsPage = withBreakpoints()(DumbLoanDetailsPage)

export default LoanDetailsPage
