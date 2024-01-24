import React from 'react'
import Button from 'cozy-ui/transpiled/react/deprecated/Button'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import { IllustrationDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Stack from 'cozy-ui/transpiled/react/Stack'

import TransferDoneImg from 'ducks/transfers/steps/TransferDoneImg'
import TransferErrorImg from 'ducks/transfers/steps/TransferErrorImg'
import { useTrackPage } from 'ducks/tracking/browser'

const TransferStateDialog = ({
  title,
  description,
  onClickPrimaryButton,
  primaryLabel,
  Img
}) => (
  <IllustrationDialog
    open
    onClose={onClickPrimaryButton}
    title={
      <Stack spacing="m" className="u-ta-center">
        {Img}
        <Typography variant="h4">{title}</Typography>
      </Stack>
    }
    content={description}
    actions={
      <Button
        extension="full"
        className="u-flex-grow-1"
        onClick={onClickPrimaryButton}
        label={primaryLabel}
      />
    }
  />
)

export const DumbTransferSuccessDialog = ({ onExit }) => {
  const { t } = useI18n()
  useTrackPage('virements:succes')
  return (
    <TransferStateDialog
      title={t('Transfer.success.title')}
      Img={<TransferDoneImg />}
      description={t('Transfer.success.description')}
      onClickPrimaryButton={onExit}
      primaryLabel={t('Transfer.exit')}
    />
  )
}

export const TransferSuccessDialog = React.memo(DumbTransferSuccessDialog)

const defaultErrorPageName = 'impossible'
const konnectorErrorToPageName = {
  LOGIN_FAILED: 'echec',
  'VENDOR_DOWN.BANK_DOWN': 'banque-indisponible'
}

const isLoginFailed = error =>
  error.message && error.message.includes('LOGIN_FAILED')

export const DumbTransferErrorDialog = ({ onExit, error }) => {
  const { t } = useI18n()
  const loginFailed = isLoginFailed(error)
  const pageName =
    konnectorErrorToPageName[error.message] || defaultErrorPageName
  useTrackPage(`virements:${pageName}`)
  return (
    <TransferStateDialog
      title={t('Transfer.error.title')}
      Img={<TransferErrorImg />}
      description={
        loginFailed
          ? t('Transfer.error.description-login-failed')
          : t('Transfer.error.description')
      }
      onClickPrimaryButton={onExit}
      primaryLabel={loginFailed ? t('Transfer.retry') : t('Transfer.exit')}
    />
  )
}

export const TransferErrorDialog = React.memo(DumbTransferErrorDialog)
