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
  translate,
  withBreakpoints,
  Alerter,
  useViewStack,
  ModalContent,
  useI18n
} from 'cozy-ui/transpiled/react'

import ModalStack from 'components/ModalStack'

import { Figure } from 'components/Figure'
import { PageModal } from 'components/PageModal'
import { PageHeader, PageBackButton } from 'components/PageModal/Page'

import CategoryIcon from 'ducks/categories/CategoryIcon'
import { getCategoryName } from 'ducks/categories/categoriesMap'
import { getCategoryId } from 'ducks/categories/helpers'

import { getLabel } from 'ducks/transactions'
import TransactionActions from 'ducks/transactions/TransactionActions'
import { updateApplicationDate } from 'ducks/transactions/helpers'

import styles from 'ducks/transactions/TransactionModal.styl'
import { getCurrencySymbol } from 'utils/currencySymbol'

import iconCredit from 'assets/icons/icon-credit.svg'
import iconCalendar from 'assets/icons/icon-calendar.svg'
import {
  getAccountLabel,
  getAccountInstitutionLabel
} from 'ducks/account/helpers'
import { TRANSACTION_DOCTYPE } from 'doctypes'
import flag from 'cozy-flags'
import { getDate, getApplicationDate } from 'ducks/transactions/helpers'

import TransactionCategoryEditor from './TransactionCategoryEditor'
import TransactionApplicationDateEditor from './TransactionApplicationDateEditor'

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

const TransactionCategoryEditorSlide = withBreakpoints()(
  translate()(props => {
    const { stackPop } = useViewStack()
    const {
      breakpoints: { isMobile }
    } = props
    return (
      <>
        <PageHeader dismissAction={stackPop}>
          {isMobile ? <PageBackButton onClick={stackPop} /> : null}
          {props.t('Categories.choice.title')}
        </PageHeader>
        <ModalContent className="u-p-0">
          <TransactionCategoryEditor
            beforeUpdate={stackPop}
            onCancel={stackPop}
            transaction={props.transaction}
          />
        </ModalContent>
      </>
    )
  })
)

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

  const showCategoryChoice = () => {
    stackPush(<TransactionCategoryEditorSlide transaction={transaction} />)
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
      <TransactionModalRowMedia onClick={showCategoryChoice}>
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

const TransactionModalInfo = withBreakpoints()(
  ({ breakpoints: { isMobile }, ...props }) => (
    <div>
      <PageHeader dismissAction={props.requestClose}>
        {isMobile ? <PageBackButton onClick={props.requestClose} /> : null}
        <TransactionModalInfoHeader {...props} />
      </PageHeader>
      <TransactionModalInfoContent {...props} />
    </div>
  )
)

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
