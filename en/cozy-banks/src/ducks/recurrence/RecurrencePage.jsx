import React, { useCallback, useRef } from 'react'
import ReactDOM from 'react-dom'
import {
  useClient,
  useQuery,
  isQueryLoading,
  hasQueryBeenLoaded
} from 'cozy-client'
import { recurrenceConn, RECURRENCE_DOCTYPE } from 'doctypes'
import { bundleTransactionsQueryConn } from './queries'

import Alerter from 'cozy-ui/transpiled/react/Alerter'
import Modal, { ModalTitle, ModalContent } from 'cozy-ui/transpiled/react/Modal'
import Button from 'cozy-ui/transpiled/react/Button'
import Field from 'cozy-ui/transpiled/react/Field'
import { Media, Img, Bd } from 'cozy-ui/transpiled/react/Media'
import { SubTitle, Caption } from 'cozy-ui/transpiled/react/Text'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Empty from 'cozy-ui/transpiled/react/Empty'
import CozyTheme from 'cozy-ui/transpiled/react/CozyTheme'
import Breadcrumbs from 'cozy-ui/transpiled/react/Breadcrumbs'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

import Loading from 'components/Loading'
import Padded from 'components/Spacing/Padded'
import {
  RowDesktop as TransactionRowDesktop,
  RowMobile as TransactionRowMobile
} from 'ducks/transactions/TransactionRow'
import Table from 'components/Table'
import Header from 'components/Header'
import BackButton from 'components/BackButton'
import BarTheme from 'ducks/bar/BarTheme'
import { getLabel } from 'ducks/recurrence/utils'
import {
  renameRecurrenceManually,
  setStatusOngoing,
  setStatusFinished,
  deleteRecurrence,
  isFinished,
  isOngoing,
  getStatus
} from 'ducks/recurrence/api'

import { BarTitle } from 'components/Title/PageTitle'
import TransactionsTableHead from 'ducks/transactions/header/TableHead'

import { BarRight } from 'components/Bar'
import { BarButton, ActionMenu, Icon } from 'cozy-ui/transpiled/react'
import {
  ActionMenuItem,
  ActionMenuRadio
} from 'cozy-ui/transpiled/react/ActionMenu'
import styles from './styles.styl'
import * as List from 'components/List'
import useToggle from 'components/useToggle'
import ActionMenuHelper from 'components/ActionMenuHelper'

import { useHistory, useParams } from 'components/RouterContext'

const useDocument = (doctype, id) => {
  const client = useClient()
  return client.getDocumentFromState(doctype, id)
}

// TODO We should need to do this (isMobile ? portal : identity) but see
// Cozy-UI's issue: https://github.com/cozy/cozy-ui/issues/1462
const identity = x => x
const portal = children => ReactDOM.createPortal(children, document.body)

// Need to reset line-height to 1 for action menus to be correctly rendered
// inside Img element
const imgLineHeightStyle = { lineHeight: 1 }

const RecurrenceActionMenu = ({
  recurrence,
  onClickRename,
  onClickOngoing,
  onClickFinished,
  onClickDelete,
  ...props
}) => {
  const { isMobile } = useBreakpoints()
  const wrapper = isMobile ? portal : identity
  return wrapper(
    <CozyTheme variant="normal">
      <ActionMenu {...props}>
        <RenameActionItem onClick={onClickRename} />
        <DeleteActionItem onClick={onClickDelete} />
        {isMobile ? (
          <>
            <hr />
            <OngoingActionItem
              recurrence={recurrence}
              onClick={onClickOngoing}
            />
            <FinishedActionItem
              recurrence={recurrence}
              onClick={onClickFinished}
            />
          </>
        ) : null}
      </ActionMenu>
    </CozyTheme>
  )
}

const RenameActionItem = ({ onClick }) => {
  const { t } = useI18n()
  return (
    <ActionMenuItem onClick={onClick} left={<Icon icon="pen" />}>
      {t('Recurrence.action-menu.rename')}
    </ActionMenuItem>
  )
}

const DeleteActionItem = ({ onClick }) => {
  const { t } = useI18n()
  return (
    <ActionMenuItem onClick={onClick} left={<Icon icon="trash" />}>
      {t('Recurrence.action-menu.delete')}
      <br />
      <Caption>{t('Recurrence.action-menu.delete-caption')}</Caption>
    </ActionMenuItem>
  )
}

const OngoingActionItem = ({ recurrence, onClick }) => {
  const { t } = useI18n()
  return (
    <ActionMenuItem
      onClick={onClick}
      left={<ActionMenuRadio readOnly checked={isOngoing(recurrence)} />}
    >
      {t('Recurrence.action-menu.ongoing')}
      <br />
      <Caption>{t('Recurrence.action-menu.ongoing-caption')}</Caption>
    </ActionMenuItem>
  )
}

const FinishedActionItem = ({ recurrence, onClick }) => {
  const { t } = useI18n()
  return (
    <ActionMenuItem
      onClick={onClick}
      left={<ActionMenuRadio readOnly checked={isFinished(recurrence)} />}
    >
      {t('Recurrence.action-menu.finished')}
    </ActionMenuItem>
  )
}

const RecurrenceStatusMenu = ({
  recurrence,
  onClickOngoing,
  onClickFinished,
  ...props
}) => {
  return (
    <CozyTheme variant="normal">
      <ActionMenu {...props}>
        <OngoingActionItem recurrence={recurrence} onClick={onClickOngoing} />
        <FinishedActionItem recurrence={recurrence} onClick={onClickFinished} />
      </ActionMenu>
    </CozyTheme>
  )
}

const RenameBundleModal = ({ bundle, dismissAction }) => {
  const client = useClient()
  const { t } = useI18n()
  const renameInputRef = useRef()

  const handleRename = async () => {
    try {
      await renameRecurrenceManually(
        client,
        bundle,
        renameInputRef.current.value
      )
      dismissAction()
      Alerter.success(t('Recurrence.rename.save-success'))
    } catch (e) {
      Alerter.error(t('Recurrence.rename.save-error'))
    }
  }

  return (
    <Modal
      size="small"
      primaryAction={() => handleRename()}
      primaryText={t('Recurrence.rename.save')}
      secondaryAction={dismissAction}
      secondaryText={t('Recurrence.rename.cancel')}
      dismissAction={dismissAction}
    >
      <ModalTitle>{t('Recurrence.rename.modal-title')}</ModalTitle>
      <ModalContent>
        <Field
          fieldProps={{ defaultValue: getLabel(bundle) }}
          inputRef={renameInputRef}
          label={t('Recurrence.table.label')}
        />
      </ModalContent>
    </Modal>
  )
}

const BundleInfo = ({ bundle }) => {
  const history = useHistory()
  const { t } = useI18n()
  const client = useClient()
  const { isMobile } = useBreakpoints()

  const [showingActionsMenu, showActionsMenu, hideActionsMenu] = useToggle(
    false
  )
  const [showingRename, showRename, hideRename] = useToggle(false)

  const goToRecurrenceRoot = useCallback(
    () => history.push('/analysis/recurrence'),
    [history]
  )

  const handleOpenRename = useCallback(() => {
    showRename()
  }, [showRename])

  const handleDelete = useCallback(async () => {
    try {
      goToRecurrenceRoot()
      await deleteRecurrence(client, bundle)
      Alerter.success(t('Recurrence.delete-success'))
    } catch (e) {
      Alerter.error(t('Recurrence.delete-error'))
    }
  }, [bundle, client, goToRecurrenceRoot, t])

  const handleSetStatusOngoing = useCallback(async () => {
    try {
      await setStatusOngoing(client, bundle)
      Alerter.success(t('Recurrence.status.save-success'))
    } catch (e) {
      Alerter.error(t('Recurrence.status.save-error'))
    }
  }, [bundle, client, t])

  const handleSetStatusFinished = useCallback(async () => {
    try {
      await setStatusFinished(client, bundle)
      Alerter.success(t('Recurrence.status.save-success'))
    } catch (e) {
      Alerter.error(t('Recurrence.status.save-error'))
    }
  }, [bundle, client, t])

  if (!bundle) {
    return null
  }

  return (
    <Header fixed theme="inverted">
      {isMobile ? (
        <>
          <BackButton theme="primary" onClick={goToRecurrenceRoot} />
          <BarTitle>{getLabel(bundle)}</BarTitle>
          <BarRight>
            <BarButton
              className={styles.BarRightButton}
              icon="dots"
              onClick={showActionsMenu}
            />
          </BarRight>
          {showingActionsMenu ? (
            <RecurrenceActionMenu
              onClose={hideActionsMenu}
              recurrence={bundle}
              onClickOngoing={handleSetStatusOngoing}
              onClickFinished={handleSetStatusFinished}
              onClickRename={handleOpenRename}
              onClickDelete={handleDelete}
            />
          ) : null}
        </>
      ) : (
        <>
          <Padded>
            <Media>
              <Bd>
                <SubTitle>
                  <Breadcrumbs
                    items={[
                      {
                        name: t('Recurrence.title'),
                        onClick: goToRecurrenceRoot
                      },
                      {
                        name: getLabel(bundle)
                      }
                    ]}
                    theme="primary"
                  />
                  <BackButton theme="primary" />
                </SubTitle>
              </Bd>
              <Img className="u-flex" style={imgLineHeightStyle}>
                <ActionMenuHelper
                  opener={
                    <Button extension="narrow" theme="secondary">
                      {t(`Recurrence.status.${getStatus(bundle)}`)}
                      <Icon className="u-ml-half" icon="bottom" />
                    </Button>
                  }
                  menu={
                    <RecurrenceStatusMenu
                      recurrence={bundle}
                      onClickRename={handleOpenRename}
                      onClickOngoing={handleSetStatusOngoing}
                      onClickFinished={handleSetStatusFinished}
                    />
                  }
                />
                <ActionMenuHelper
                  opener={
                    <Button
                      iconOnly
                      label={t('Recurrence.action-menu.open-button')}
                      extension="narrow"
                      icon="dots"
                      theme="secondary"
                    />
                  }
                  menu={
                    <RecurrenceActionMenu
                      recurrence={bundle}
                      onClickRename={handleOpenRename}
                      onClickOngoing={handleSetStatusOngoing}
                      onClickFinished={handleSetStatusFinished}
                      onClickDelete={handleDelete}
                    />
                  }
                />
              </Img>
            </Media>
          </Padded>
          <TransactionsTableHead />
        </>
      )}

      {showingRename ? (
        <RenameBundleModal
          bundle={bundle}
          onSuccess={hideRename}
          dismissAction={hideRename}
        />
      ) : null}
    </Header>
  )
}

const BundleMobileWrapper = ({ children }) => {
  return <div className={styles.RecurrencesMobileContent}>{children}</div>
}

const BundleDesktopWrapper = ({ children }) => {
  return (
    <Table>
      <tbody>{children}</tbody>
    </Table>
  )
}

const BundleTransactionMobile = ({ transaction }) => {
  const { f } = useI18n()
  const { date } = transaction
  return (
    <>
      <List.Header>{f(date, 'dddd D MMMM')}</List.Header>
      <TransactionRowMobile showRecurrence={false} transaction={transaction} />
    </>
  )
}

const BundleTransactions = ({ bundle }) => {
  const transactionsConn = bundleTransactionsQueryConn({ bundle })
  const { isMobile } = useBreakpoints()
  const { t } = useI18n()
  const transactionCol = useQuery(transactionsConn.query, transactionsConn)

  if (isQueryLoading(transactionCol) && !hasQueryBeenLoaded(transactionCol)) {
    return <Loading />
  }

  const { data: transactions, fetchStatus, lastError } = transactionCol

  const TransactionRow = isMobile
    ? BundleTransactionMobile
    : TransactionRowDesktop
  const Wrapper = isMobile ? BundleMobileWrapper : BundleDesktopWrapper

  return (
    <>
      <Wrapper>
        {transactions.length === 0 ? (
          <Padded>
            {fetchStatus === 'failed' ? (
              <>
                <p>{t('Loading.error')}</p>
                <p>{lastError && lastError.message}</p>
              </>
            ) : (
              <Empty
                icon={{}}
                title={t('Recurrence.no-transactions.title')}
                text={t('Recurrence.no-transactions.text')}
              />
            )}
          </Padded>
        ) : null}
        {transactions.map(tr => (
          <TransactionRow
            showRecurrence={false}
            transaction={tr}
            key={tr._id}
          />
        ))}
      </Wrapper>
    </>
  )
}

const RecurrencePage = () => {
  const params = useParams()
  const recurrenceCol = useQuery(recurrenceConn.query, recurrenceConn)

  const bundleId = params.bundleId
  const bundle = useDocument(RECURRENCE_DOCTYPE, bundleId)

  if (isQueryLoading(recurrenceCol) && !hasQueryBeenLoaded(recurrenceCol)) {
    return <Loading />
  }

  return (
    <>
      <BarTheme theme="primary" />
      {bundle ? <BundleInfo bundle={bundle} /> : null}
      {bundle ? <BundleTransactions bundle={bundle} /> : null}
    </>
  )
}

export default RecurrencePage
