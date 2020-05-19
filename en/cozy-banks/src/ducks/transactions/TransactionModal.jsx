/**
 * Is used in mobile/tablet mode when you click on the more button
 */

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import {
  Icon,
  Spinner,
  Bd,
  Img,
  Alerter,
  useViewStack,
  ModalContent,
  useI18n,
  useBreakpoints,
  Caption,
  Chip
} from 'cozy-ui/transpiled/react'

import { withRouter, Link } from 'react-router'
import ModalStack from 'components/ModalStack'

import Figure from 'cozy-ui/transpiled/react/Figure'
import { PageModal } from 'components/PageModal'
import { PageHeader, PageBackButton } from 'components/PageModal/Page'

import CategoryIcon from 'ducks/categories/CategoryIcon'
import { getCategoryName } from 'ducks/categories/categoriesMap'
import { getCategoryId } from 'ducks/transactions/helpers'

import { getLabel } from 'ducks/transactions'
import TransactionActions from 'ducks/transactions/TransactionActions'
import { updateApplicationDate } from 'ducks/transactions/helpers'

import styles from 'ducks/transactions/TransactionModal.styl'
import { getCurrencySymbol } from 'utils/currencySymbol'

import iconCredit from 'assets/icons/icon-credit.svg'
import iconCalendar from 'assets/icons/icon-calendar.svg'
import iconRecurrence from 'assets/icons/icon-recurrence.svg'
import {
  getAccountLabel,
  getAccountInstitutionLabel
} from 'ducks/account/helpers'
import { TRANSACTION_DOCTYPE } from 'doctypes'
import flag from 'cozy-flags'
import { getDate, getApplicationDate } from 'ducks/transactions/helpers'

import TransactionCategoryEditor from './TransactionCategoryEditor'
import TransactionApplicationDateEditor from './TransactionApplicationDateEditor'
import TransactionRecurrenceEditor from 'ducks/transactions/TransactionRecurrenceEditor'

import { getFrequencyText } from 'ducks/recurrence/utils'
import TransactionModalRow, {
  TransactionModalRowIcon,
  TransactionModalRowMedia,
  RowArrow
} from './TransactionModalRow'

import withDocs from 'components/withDocs'

const TransactionLabel = ({ label }) => (
  <div className={styles.TransactionLabel}>{label}</div>
)

const TransactionInfo = ({ label, value }) => (
  <div className={styles.TransactionInfo}>
    <span className={styles.TransactionInfoLabel}>{label} :</span>
    {value}
  </div>
)

const TransactionInfos = ({ infos }) => (
  <div>
    {infos.map(({ label, value }) => (
      <TransactionInfo key={label} label={label} value={value} />
    ))}
  </div>
)

const withTransaction = withDocs(ownProps => ({
  transaction: [TRANSACTION_DOCTYPE, ownProps.transactionId]
}))

const TransactionCategoryEditorSlide = ({ transaction }) => {
  const { t } = useI18n()
  const { stackPop } = useViewStack()
  const { isMobile } = useBreakpoints()
  return (
    <>
      <PageHeader dismissAction={stackPop}>
        {isMobile ? <PageBackButton onClick={stackPop} /> : null}
        {t('Categories.choice.title')}
      </PageHeader>
      <ModalContent className="u-p-0">
        <TransactionCategoryEditor
          beforeUpdate={stackPop}
          onCancel={stackPop}
          transaction={transaction}
        />
      </ModalContent>
    </>
  )
}

const TransactionApplicationDateEditorSlide = ({
  transaction,
  beforeUpdate,
  afterUpdate
}) => {
  const { t } = useI18n()
  const { stackPop } = useViewStack()
  const handleBeforeUpdate = () => {
    beforeUpdate()
    stackPop()
  }

  return (
    <div>
      <PageHeader dismissAction={stackPop}>
        {t('Transactions.infos.chooseApplicationDate')}
      </PageHeader>
      <TransactionApplicationDateEditor
        beforeUpdate={handleBeforeUpdate}
        afterUpdate={afterUpdate}
        transaction={transaction}
      />
    </div>
  )
}

export const showAlertAfterApplicationDateUpdate = (transaction, t, f) => {
  const date = getApplicationDate(transaction) || getDate(transaction)
  Alerter.success(
    t('Transactions.infos.applicationDateChangedAlert', {
      applicationDate: f(date, 'MMMM')
    })
  )
}

const stopPropagation = ev => ev.stopPropagation()

const RecurrenceRow = withRouter(({ transaction, onClick, router }) => {
  const recurrence = transaction.recurrence && transaction.recurrence.data
  const { t } = useI18n()

  const recurrenceRoute = recurrence ? `/recurrence/${recurrence._id}` : null

  return (
    <TransactionModalRowMedia
      align={recurrence ? 'top' : undefined}
      onClick={onClick}
    >
      <Img>
        <TransactionModalRowIcon icon={iconRecurrence} />
      </Img>
      <Bd>
        <div>
          {recurrence
            ? t('Recurrence.choice.recurrent')
            : t('Recurrence.choice.not-recurrent')}
          {recurrence ? (
            <>
              <br />
              <Caption>{getFrequencyText(t, recurrence)}</Caption>
              {router.location.pathname !== recurrenceRoute ? (
                <Link to={recurrenceRoute}>
                  <Chip
                    onClick={stopPropagation}
                    variant="outlined"
                    size="small"
                    className="u-w-100 u-ph-2 u-mt-half u-flex-justify-center"
                  >
                    {t('Recurrence.see-transaction-history')}
                  </Chip>
                </Link>
              ) : null}
            </>
          ) : null}
        </div>
      </Bd>
      <Img>
        <RowArrow />
      </Img>
    </TransactionModalRowMedia>
  )
})

const TransactionRecurrenceEditorSlide = ({ transaction }) => {
  const { t } = useI18n()

  const { stackPop } = useViewStack()

  return (
    <div>
      <PageHeader dismissAction={stackPop}>
        {t('Transactions.infos.chooseRecurrence')}
      </PageHeader>
      <ModalContent className="u-p-0">
        <TransactionRecurrenceEditor
          onSelect={x => x}
          beforeUpdate={stackPop}
          onCancel={stackPop}
          transaction={transaction}
        />
      </ModalContent>
    </div>
  )
}

/**
 * Show information of the transaction
 */
const TransactionModalInfoContent = withTransaction(props => {
  const { t, f } = useI18n()
  const { stackPush } = useViewStack()
  const { transaction, client, ...restProps } = props

  const typeIcon = (
    <Icon
      icon={iconCredit}
      width={16}
      className={cx({
        [styles['TransactionModalRowIcon-reversed']]: transaction.amount < 0
      })}
    />
  )

  const categoryId = getCategoryId(transaction)
  const account = transaction.account.data

  const handleShowCategoryChoice = () => {
    stackPush(<TransactionCategoryEditorSlide transaction={transaction} />)
  }

  const handleShowRecurrenceChoice = () => {
    stackPush(<TransactionRecurrenceEditorSlide transaction={transaction} />)
  }

  const [applicationDateBusy, setApplicationDateBusy] = useState(false)

  const handleAfterUpdateApplicationDate = updatedTransaction => {
    setApplicationDateBusy(false)
    showAlertAfterApplicationDateUpdate(updatedTransaction, t, f)
  }

  const handleShowApplicationEditor = ev => {
    !ev.defaultPrevented &&
      stackPush(
        <TransactionApplicationDateEditorSlide
          beforeUpdate={() => setApplicationDateBusy(true)}
          afterUpdate={handleAfterUpdateApplicationDate}
          transaction={transaction}
        />,
        { size: 'xsmall', mobileFullscreen: false }
      )
  }

  const handleResetApplicationDate = async ev => {
    ev.preventDefault()
    try {
      setApplicationDateBusy(true)
      const newTransaction = await updateApplicationDate(
        client,
        transaction,
        null
      )
      showAlertAfterApplicationDateUpdate(newTransaction, t, f)
    } finally {
      setApplicationDateBusy(false)
    }
  }

  const shouldShowRestoreApplicationDateIcon =
    getApplicationDate(transaction) && !applicationDateBusy

  return (
    <div className={styles['Separated']}>
      <TransactionModalRow iconLeft={typeIcon} align="top">
        <TransactionLabel label={getLabel(transaction)} />
        <TransactionInfos
          infos={[
            {
              label: t('Transactions.infos.account'),
              value: getAccountLabel(account)
            },
            {
              label: t('Transactions.infos.institution'),
              value: getAccountInstitutionLabel(account)
            },
            {
              label: t('Transactions.infos.originalBankLabel'),
              value: flag('originalBankLabel') && transaction.originalBankLabel
            },
            {
              label: t('Transactions.infos.date'),
              value: f(getDate(transaction), 'dddd D MMMM')
            }
          ].filter(x => x.value)}
        />
      </TransactionModalRow>
      <TransactionModalRowMedia onClick={handleShowCategoryChoice}>
        <Img>
          <CategoryIcon categoryId={categoryId} />
        </Img>
        <Bd>
          {t(
            `Data.subcategories.${getCategoryName(getCategoryId(transaction))}`
          )}
        </Bd>
        <Img>
          <RowArrow />
        </Img>
      </TransactionModalRowMedia>
      <TransactionModalRowMedia onClick={handleShowApplicationEditor}>
        <TransactionModalRowIcon icon={iconCalendar} />
        <Bd>
          {t('Transactions.infos.assignedToPeriod', {
            date: f(
              getApplicationDate(transaction) || getDate(transaction),
              'MMM YYYY'
            )
          })}
        </Bd>
        {shouldShowRestoreApplicationDateIcon ? (
          <Img>
            <span
              onClick={handleResetApplicationDate}
              className="u-expanded-click-area"
            >
              <Icon color="var(--slateGrey)" icon="restore" />
            </span>
          </Img>
        ) : null}
        {applicationDateBusy ? (
          <Img>
            <Spinner />
          </Img>
        ) : null}
        <Img>
          <RowArrow />
        </Img>
      </TransactionModalRowMedia>
      {flag('banks.recurrence') ? (
        <RecurrenceRow
          transaction={transaction}
          onClick={handleShowRecurrenceChoice}
        />
      ) : null}
      <TransactionActions
        transaction={transaction}
        {...restProps}
        displayDefaultAction
        isModalItem
      />
    </div>
  )
})

const TransactionModalInfoHeader = withTransaction(({ transaction }) => (
  <Figure
    total={transaction.amount}
    symbol={getCurrencySymbol(transaction.currency)}
    signed
  />
))

const TransactionModalInfo = props => {
  const { isMobile } = useBreakpoints()
  return (
    <div>
      <PageHeader dismissAction={props.requestClose}>
        {isMobile ? <PageBackButton onClick={props.requestClose} /> : null}
        <TransactionModalInfoHeader {...props} />
      </PageHeader>
      <TransactionModalInfoContent {...props} />
    </div>
  )
}

const TransactionModal = ({ requestClose, ...props }) => {
  const { t } = useI18n()
  return (
    <PageModal
      aria-label={t('Transactions.infos.modal-label')}
      dismissAction={requestClose}
      into="body"
      overflowHidden
    >
      <ModalStack>
        <TransactionModalInfo {...props} requestClose={requestClose} />
      </ModalStack>
    </PageModal>
  )
}

TransactionModal.propTypes = {
  requestClose: PropTypes.func.isRequired,
  transactionId: PropTypes.string.isRequired
}

export default TransactionModal
