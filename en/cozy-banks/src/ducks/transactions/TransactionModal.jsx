/**
 * Is used to have more information on a transaction. Can edit
 * - the recurrence
 * - the cateogry of transaction
 * - the date
 */

import React, { useState, useCallback } from 'react'
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

import { Link } from 'react-router'
import ModalStack from 'components/ModalStack'

import Figure from 'cozy-ui/transpiled/react/Figure'
import { PageModal } from 'components/PageModal'
import { PageHeader, PageBackButton } from 'components/PageModal/Page'

import CategoryIcon from 'ducks/categories/CategoryIcon'
import { getCategoryName } from 'ducks/categories/categoriesMap'
import {
  getCategoryId,
  updateApplicationDate,
  getDate,
  getApplicationDate
} from 'ducks/transactions/helpers'

import { getLabel } from 'ducks/transactions'
import TransactionActions from 'ducks/transactions/TransactionActions'
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

import {
  trackEvent,
  useTrackPage,
  trackParentPage
} from 'ducks/tracking/browser'
import { getFrequencyText } from 'ducks/recurrence/utils'
import TransactionCategoryEditor from 'ducks/transactions/TransactionCategoryEditor'
import TransactionApplicationDateEditor from 'ducks/transactions/TransactionApplicationDateEditor'
import TransactionRecurrenceEditor from 'ducks/transactions/TransactionRecurrenceEditor'
import TransactionModalRow, {
  TransactionModalRowIcon,
  TransactionModalRowMedia,
  RowArrow
} from 'ducks/transactions/TransactionModalRow'

import withDocs from 'components/withDocs'
import { useLocation } from 'components/RouterContext'

const SearchForTransactionIcon = ({ transaction }) => {
  const label = getLabel(transaction)
  return (
    <a href={`#/search/${label}`}>
      <Icon className="u-ml-half u-coolGrey" icon="magnifier" />
    </a>
  )
}

const TransactionLabel = ({ transaction }) => {
  const label = getLabel(transaction)

  return (
    <div className={styles.TransactionLabel}>
      {label}
      {flag('banks.search') ? (
        <>
          {' '}
          <SearchForTransactionIcon transaction={transaction} />
        </>
      ) : null}
    </div>
  )
}

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
  const { stackPop: rawStackPop } = useViewStack()
  const { isMobile } = useBreakpoints()

  const onAfterUpdate = transaction => {
    trackEvent({
      name: getCategoryName(transaction.manualCategoryId)
    })
  }

  useTrackPage(lastTracked => `${lastTracked}:depense-categorie`)

  const stackPop = useCallback(() => {
    trackParentPage()
    rawStackPop()
  }, [rawStackPop])

  return (
    <>
      <PageHeader dismissAction={stackPop}>
        {isMobile ? <PageBackButton onClick={stackPop} /> : null}
        {t('Categories.choice.title')}
      </PageHeader>
      <ModalContent className="u-p-0">
        <TransactionCategoryEditor
          beforeUpdate={stackPop}
          afterUpdate={onAfterUpdate}
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
  const { stackPop: rawStackPop } = useViewStack()

  useTrackPage(lastTracked => `${lastTracked}:affectation_mois`)

  const stackPop = useCallback(() => {
    trackParentPage()
    rawStackPop()
  }, [rawStackPop])

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

const RecurrenceRow = ({ transaction, onClick }) => {
  const location = useLocation()
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
              {location.pathname !== recurrenceRoute ? (
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
}

const TransactionRecurrenceEditorSlide = ({ transaction }) => {
  const { t } = useI18n()

  const { stackPop: rawStackPop } = useViewStack()

  useTrackPage(lastTracked => `${lastTracked}:affectation_recurrence`)

  const stackPop = useCallback(() => {
    trackParentPage()
    rawStackPop()
  }, [rawStackPop])

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
    const date =
      getApplicationDate(updatedTransaction) || getDate(updatedTransaction)
    trackEvent({
      name: date
    })
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
        <TransactionLabel transaction={transaction} />
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
      <RecurrenceRow
        transaction={transaction}
        onClick={handleShowRecurrenceChoice}
      />
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

  useTrackPage(lastTracked => `${lastTracked}:depense`)

  const handleRequestClose = () => {
    trackParentPage()
    requestClose()
  }

  const handleModalStackPop = () => {
    trackParentPage()
  }

  return (
    <PageModal
      aria-label={t('Transactions.infos.modal-label')}
      dismissAction={handleRequestClose}
      into="body"
      overflowHidden
    >
      <ModalStack onPop={handleModalStackPop}>
        <TransactionModalInfo {...props} requestClose={handleRequestClose} />
      </ModalStack>
    </PageModal>
  )
}

TransactionModal.propTypes = {
  requestClose: PropTypes.func.isRequired,
  transactionId: PropTypes.string.isRequired
}

export default TransactionModal
