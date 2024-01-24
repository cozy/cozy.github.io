import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClient } from 'cozy-client'

import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'
import Button from 'cozy-ui/transpiled/react/deprecated/Button'
import { Media, Img, Bd } from 'cozy-ui/transpiled/react/deprecated/Media'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import CozyTheme from 'cozy-ui/transpiled/react/providers/CozyTheme'
import Breadcrumbs from 'cozy-ui/transpiled/react/legacy/Breadcrumbs'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import BottomIcon from 'cozy-ui/transpiled/react/Icons/Bottom'
import DotsIcon from 'cozy-ui/transpiled/react/Icons/Dots'
import Icon from 'cozy-ui/transpiled/react/Icon'
import Typography from 'cozy-ui/transpiled/react/Typography'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import Fade from 'cozy-ui/transpiled/react/Fade'

import Padded from 'components/Padded'
import Header from 'components/Header'
import useToggle from 'components/useToggle'
import BackButton from 'components/BackButton'
import ActionMenuHelper from 'components/ActionMenuHelper'
import { getLabel } from 'ducks/recurrence/utils'
import { BarTitle } from 'components/Title/PageTitle'
import { BarRight } from 'components/Bar'
import TransactionsTableHead from 'ducks/transactions/header/TableHead'
import {
  setStatusOngoing,
  setStatusFinished,
  deleteRecurrence,
  getStatus
} from 'ducks/recurrence/api'
import RecurrenceActionMenu from 'ducks/recurrence/RecurrencePage/RecurrenceActionMenu'
import RecurrenceStatusMenu from 'ducks/recurrence/RecurrencePage/RecurrenceStatusMenu'
import RenameBundleDialog from 'ducks/recurrence/RecurrencePage/RenameBundleDialog'

// Need to reset line-height to 1 for action menus to be correctly rendered
// inside Img element
const imgLineHeightStyle = { lineHeight: 1 }

const BundleInfo = ({ bundle }) => {
  const navigate = useNavigate()
  const { t } = useI18n()
  const client = useClient()
  const { isMobile } = useBreakpoints()

  const [showingActionsMenu, showActionsMenu, hideActionsMenu] =
    useToggle(false)
  const [showingRename, showRename, hideRename] = useToggle(false)

  const goToRecurrenceRoot = useCallback(
    () => navigate('/analysis/recurrence'),
    [navigate]
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
            <IconButton
              className="u-mr-half"
              onClick={showActionsMenu}
              size="medium"
            >
              <Icon icon={DotsIcon} />
            </IconButton>
          </BarRight>
          {showingActionsMenu && (
            <RecurrenceActionMenu
              onClose={hideActionsMenu}
              recurrence={bundle}
              onClickOngoing={handleSetStatusOngoing}
              onClickFinished={handleSetStatusFinished}
              onClickRename={handleOpenRename}
              onClickDelete={handleDelete}
            />
          )}
        </>
      ) : (
        <>
          <Padded>
            <Media>
              {/* Bd has overflow:hidden and it crops the hover circle from the Breadcrumbs
	          IconButton, this is why we have to add u-ov-visible. */}
              <Bd className="u-ov-visible">
                <Fade in>
                  <Typography variant="h5">
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
                  </Typography>
                </Fade>
              </Bd>
              <Img className="u-flex" style={imgLineHeightStyle}>
                <ActionMenuHelper
                  opener={
                    <Button
                      extension="narrow"
                      theme="secondary"
                      label={t(`Recurrence.status.${getStatus(bundle)}`)}
                      extraRight={
                        <Icon className="u-ml-half" icon={BottomIcon} />
                      }
                    />
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
                      icon={<Icon icon={DotsIcon} />}
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

      {showingRename && (
        <CozyTheme variant="normal">
          <RenameBundleDialog
            bundle={bundle}
            onSuccess={hideRename}
            dismissAction={hideRename}
          />
        </CozyTheme>
      )}
    </Header>
  )
}

export default React.memo(BundleInfo)
