import React from 'react'
import cx from 'classnames'
import get from 'lodash/get'
import { translate, useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import CompositeRow from 'cozy-ui/transpiled/react/deprecated/CompositeRow'
import NarrowContent from 'cozy-ui/transpiled/react/deprecated/NarrowContent'
import Figure from 'cozy-ui/transpiled/react/Figure'

import { BalanceDetailsHeader } from 'ducks/balance'
import { Section as BaseSection } from 'components/Section'
import styles from 'ducks/loan/LoanDetailsPage.styl'
import LoanProgress from 'ducks/loan/LoanProgress'
import Padded from 'components/Padded'
import { getBorrowedAmount } from 'ducks/account/helpers'

import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

const DATE_FORMAT = 'DD/MM/YY'

const DumbRow = props => {
  const { isMobile } = useBreakpoints()
  const { f } = useI18n()
  const {
    type,
    title,
    value: originalValue,
    caption,
    className,
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

export const Row = DumbRow

export const Section = props => {
  const { title, children } = props

  return <BaseSection title={title}>{children}</BaseSection>
}

const isExistingData = data => data !== undefined && data !== null

export const KeyInfosSection = props => {
  const { t } = useI18n()
  const { account } = props

  const borrowedAmount = getBorrowedAmount(account)
  const balance = get(account, 'balance')
  const rate = get(account, 'loan.rate')
  const shouldRender = [borrowedAmount, balance, rate].some(isExistingData)

  if (!shouldRender) {
    return null
  }

  return (
    <Section title={t('LoanDetails.keyInfos.title')}>
      <Row
        type="amount"
        title={t('LoanDetails.keyInfos.borrowedAmount')}
        value={borrowedAmount}
      />
      <Row
        type="amount"
        title={t('LoanDetails.keyInfos.remainingCapital')}
        value={Math.abs(balance)}
      />
      <Row
        type="rate"
        title={t('LoanDetails.keyInfos.interestRate')}
        value={rate}
      />
    </Section>
  )
}

export const PaymentsSection = props => {
  const { t, f } = useI18n()
  const { account } = props

  const lastPaymentAmount = get(account, 'loan.lastPaymentAmount')
  const nextPaymentAmount = get(account, 'loan.nextPaymentAmount')

  const shouldRender = [lastPaymentAmount, nextPaymentAmount].some(
    isExistingData
  )

  if (!shouldRender) {
    return null
  }

  const lastPaymentDate = get(account, 'loan.lastPaymentDate')
  const nextPaymentDate = get(account, 'loan.nextPaymentDate')

  return (
    <Section title={t('LoanDetails.payments.title')}>
      <Row
        type="amount"
        title={t('LoanDetails.payments.lastPayment')}
        value={get(account, 'loan.lastPaymentAmount')}
        caption={
          lastPaymentDate
            ? `${t('LoanDetails.dateGlue')} ${f(lastPaymentDate, DATE_FORMAT)}`
            : undefined
        }
      />
      <Row
        type="amount"
        title={t('LoanDetails.payments.nextPayment')}
        value={get(account, 'loan.nextPaymentAmount')}
        caption={
          nextPaymentDate
            ? `${t('LoanDetails.dateGlue')} ${f(nextPaymentDate, DATE_FORMAT)}`
            : undefined
        }
      />
    </Section>
  )
}

export const CharacteristicsSection = props => {
  const { t } = useI18n()
  const { account } = props

  const subscriptionDate = get(account, 'loan.subscriptionDate')
  const maturityDate = get(account, 'loan.maturityDate')
  const nbPaymentsLeft = get(account, 'loan.nbPaymentsLeft')
  const nbPaymentsDone = get(account, 'loan.nbPaymentsDone')

  const shouldRender = [
    subscriptionDate,
    maturityDate,
    nbPaymentsLeft,
    nbPaymentsDone
  ].some(isExistingData)

  if (!shouldRender) {
    return null
  }

  return (
    <Section title={t('LoanDetails.characteristics.title')}>
      <Row
        type="date"
        title={t('LoanDetails.characteristics.subscriptionDate')}
        value={subscriptionDate}
      />
      <Row
        type="date"
        title={t('LoanDetails.characteristics.maturityDate')}
        value={maturityDate}
      />
      <Row
        type="nb-payments"
        title={t('LoanDetails.characteristics.nbPaymentsLeft')}
        value={nbPaymentsLeft}
      />
      <Row
        type="nb-payments"
        title={t('LoanDetails.characteristics.nbPaymentsDone')}
        value={nbPaymentsDone}
      />
    </Section>
  )
}

export const CreditReserveSection = props => {
  const { t } = useI18n()
  const { account } = props

  const totalAmount = get(account, 'loan.totalAmount')
  const availableAmount = get(account, 'loan.availableAmount')

  const shouldRender =
    account.type === 'RevolvingCredit' &&
    [totalAmount, availableAmount].some(isExistingData)

  if (!shouldRender) {
    return null
  }

  return (
    <Section title={t('LoanDetails.creditReserve.title')}>
      <Row
        type="amount"
        title={t('LoanDetails.creditReserve.totalUsedAmount')}
        value={totalAmount}
      />
      <Row
        type="amount"
        title={t('LoanDetails.creditReserve.availableAmount')}
        value={availableAmount}
      />
    </Section>
  )
}

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
  const { isMobile } = useBreakpoints()
  const { filteringDoc: account } = props

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

const LoanDetailsPage = DumbLoanDetailsPage

export default LoanDetailsPage
