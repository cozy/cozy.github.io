import React, { useState, useCallback, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useClient, useQuery } from 'cozy-client'
import { withRouter } from 'react-router'
import { recurrenceConn, RECURRENCE_DOCTYPE } from 'doctypes'
import { bundleTransactionsQueryConn } from './queries'

import Alerter from 'cozy-ui/transpiled/react/Alerter'
import Modal, { ModalTitle, ModalContent } from 'cozy-ui/transpiled/react/Modal'
import Button from 'cozy-ui/transpiled/react/Button'
import Field from 'cozy-ui/transpiled/react/Field'
import { Media, Img, Bd } from 'cozy-ui/transpiled/react/Media'
import { SubTitle, Caption } from 'cozy-ui/transpiled/react/Text'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
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
import { getLabel, getFrequencyText } from 'ducks/recurrence/utils'
import {
  renameRecurrenceManually,
  setStatusOngoing,
  setStatusFinished,
  deleteRecurrence,
  isFinished,
  isOngoing,
  getStatus
} from 'ducks/recurrence/api'

import AnalysisTabs from 'ducks/analysis/AnalysisTabs'
import { BarTitle } from 'components/Title/PageTitle'
import TransactionsTableHead from 'ducks/transactions/header/TableHead'

import { BarRight } from 'components/Bar'
import { BarButton, ActionMenu, Icon } from 'cozy-ui/transpiled/react'
import {
  ActionMenuHeader,
  ActionMenuItem,
  ActionMenuRadio
} from 'cozy-ui/transpiled/react/ActionMenu'
import styles from './styles.styl'
import * as List from 'components/List'

const useDocument = (doctype, id) => {
  const client = useClient()
  return client.getDocumentFromState(doctype, id)
}

// TODO We should need to do this (isMobile ? portal : identity) but see
// Cozy-UI's issue: https://github.com/cozy/cozy-ui/issues/1462
const identity = x => x
const portal = children => ReactDOM.createPortal(children, document.body)

const RecurrenceActionMenu = ({
  recurrence,
  onClickRename,
  onClickOngoing,
  onClickFinished,
  onClickDelete,
  ...props
}) => {
  const { isMobile } = useBreakpoints()
  const { t } = useI18n()
  const wrapper = isMobile ? portal : identity
  return wrapper(
    <ActionMenu {...props}>
      <ActionMenuHeader>
        <SubTitle>{getLabel(recurrence)}</SubTitle>
        <Caption>{getFrequencyText(t, recurrence)}</Caption>
      </ActionMenuHeader>
      {isMobile ? (
        <>
          <OngoingActionItem recurrence={recurrence} onClick={onClickOngoing} />
          <FinishedActionItem
            recurrence={recurrence}
            onClick={onClickFinished}
          />
          <hr />
        </>
      ) : null}
      <RenameActionItem onClick={onClickRename} />
      <DeleteActionItem onClick={onClickDelete} />
    </ActionMenu>
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
    <ActionMenu {...props}>
      <OngoingActionItem recurrence={recurrence} onClick={onClickOngoing} />
      <FinishedActionItem recurrence={recurrence} onClick={onClickFinished} />
    </ActionMenu>
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

const useToggle = initial => {
  const [val, setVal] = useState(initial)
  const setTrue = useCallback(() => setVal(true), [setVal])
  const setFalse = useCallback(() => setVal(false), [setVal])
  return [val, setTrue, setFalse]
}

const ActionMenuHelper = ({ opener, menu }) => {
  const [opened, openMenu, closeMenu] = useToggle(false)
  const openerRef = useRef()
  return (
    <div className="u-inline-flex">
      {React.cloneElement(opener, { onClick: openMenu, ref: openerRef })}
      {opened
        ? React.cloneElement(menu, {
            autoclose: true,
            onClose: closeMenu,
            placement: 'bottom-end'
          })
        : null}
    </div>
  )
}

const BundleInfo = withRouter(({ bundle, router }) => {
  const { t } = useI18n()
  const client = useClient()
  const { isMobile } = useBreakpoints()
  if (!bundle) {
    return null
  }

  const [showingActionsMenu, showActionsMenu, hideActionsMenu] = useToggle(
    false
  )
  const [showingRename, showRename, hideRename] = useToggle(false)

  const goToRecurrenceRoot = useCallback(() => router.push('/recurrence'), [
    router
  ])

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
          <AnalysisTabs />
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
              <Img className="u-flex">
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
})

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
  const { data: transactions } = useQuery(
    transactionsConn.query,
    transactionsConn
  )

  if (!transactions) {
    return null
  }

  const TransactionRow = isMobile
    ? BundleTransactionMobile
    : TransactionRowDesktop
  const Wrapper = isMobile ? BundleMobileWrapper : BundleDesktopWrapper

  return (
    <>
      <Wrapper>
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

const RecurrenceBundlePage = ({ params }) => {
  const { data: bundles, fetchStatus } = useQuery(
    recurrenceConn.query,
    recurrenceConn
  )

  const bundleId = params.bundleId
  const bundle = useDocument(RECURRENCE_DOCTYPE, bundleId)

  if (fetchStatus === 'loading' && !bundles) {
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

export default withRouter(RecurrenceBundlePage)
