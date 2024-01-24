import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import logger from 'cozy-logger'
import { useClient } from 'cozy-client'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import Button from 'cozy-ui/transpiled/react/Buttons'
import { IllustrationDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'
import useRealtime from 'cozy-realtime/dist/useRealtime'

import {
  getEmptyActionLabel,
  launchImportJob,
  uploadImportFile
} from 'ducks/settings/Import/helpers'
import ImportContent from 'ducks/settings/Import/ImportContents/ImportContent'
import { JOBS_DOCTYPE } from 'doctypes'

const log = logger.namespace('import.banks')

const initialImportState = {
  isBusy: false,
  isSuccess: false,
  isServiceInProgress: false
}
const Import = () => {
  const [importState, setImportState] = useState(initialImportState)
  const [importJobId, setImportJobId] = useState(null)
  const [file, setFile] = useState(null)
  const navigate = useNavigate()
  const client = useClient()
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const { isBusy, isSuccess, isServiceInProgress } = importState

  const onJobUpdate = job => {
    if (importJobId !== job._id) return

    const { state } = job

    if (state === 'errored') {
      setImportState(initialImportState)
      setFile(null)
      Alerter.error(t('Settings.import.alerter.failed'))
      log('error', `Error encountered with import job: ${job._id}`)
      return
    }

    if (state === 'done') {
      setImportState(prev => ({
        ...prev,
        isServiceInProgress: false,
        isSuccess: true
      }))
      Alerter.success(t('Settings.import.alerter.done'))
      log('info', `Import job ${job._id}, completed successfully`)
      return
    }
  }

  useRealtime(client, {
    [JOBS_DOCTYPE]: {
      updated: onJobUpdate
    }
  })

  const onBackOrClose =
    !isServiceInProgress && !isBusy
      ? (_, reason) => {
          if (reason && reason == 'backdropClick') return undefined
          return navigate('..')
        }
      : undefined

  const onClickAction = async () => {
    if (isSuccess) return navigate('..')

    try {
      setImportState(prev => ({ ...prev, isBusy: true }))

      const { data: fileCreated } = await uploadImportFile(client, file)
      setImportState(prev => ({
        ...prev,
        isServiceInProgress: true,
        isBusy: false
      }))

      const { data: jobCreated } = await launchImportJob(
        client,
        fileCreated._id
      )
      setImportJobId(jobCreated.id)
    } catch (error) {
      setImportState(initialImportState)
      Alerter.error(t('Settings.import.alerter.failed'))
      log('error', `Error encountered while importing data: ${error}`)
    }
  }

  const emptyActionLabel = getEmptyActionLabel({
    isBusy,
    isServiceInProgress,
    isSuccess,
    t
  })

  const contentProps = { file, setFile, ...importState }

  return (
    <IllustrationDialog
      open
      {...(!isMobile ? { onClose: onBackOrClose } : { onBack: onBackOrClose })}
      content={<ImportContent {...contentProps} />}
      data-testid="IllustrationDialog"
      actions={
        <Button
          onClick={onClickAction}
          variant={isSuccess ? 'secondary' : 'primary'}
          fullWidth
          disabled={!file}
          busy={isBusy || isServiceInProgress}
          label={emptyActionLabel}
          data-testid="ImportButton"
        />
      }
    />
  )
}

export default Import
