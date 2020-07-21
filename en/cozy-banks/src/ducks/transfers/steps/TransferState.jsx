import React from 'react'
import Padded from 'components/Spacing/Padded'
import { Text, Button, useI18n } from 'cozy-ui/transpiled/react'

import styles from 'ducks/transfers/styles.styl'
import Title from 'ducks/transfers/steps/Title'
import TransferDoneImg from 'ducks/transfers/steps/TransferDoneImg'
import TransferErrorImg from 'ducks/transfers/steps/TransferErrorImg'

const TransferState = ({
  title,
  description,
  onClickPrimaryButton,
  primaryLabel,
  Img
}) => (
  <Padded className={styles.TransferState}>
    <Title className="u-mb-1-half">{title}</Title>
    {Img}
    <Text className="u-mb-1-half u-ta-center">{description}</Text>
    <Button
      extension="full"
      className="u-mb-half"
      onClick={onClickPrimaryButton}
      label={primaryLabel}
    />
  </Padded>
)

export const TransferSuccess = React.memo(function TransferSuccess({ onExit }) {
  const { t } = useI18n()
  return (
    <TransferState
      title={t('Transfer.success.title')}
      Img={<TransferDoneImg />}
      description={t('Transfer.success.description')}
      onClickPrimaryButton={onExit}
      primaryLabel={t('Transfer.exit')}
    />
  )
})

const isLoginFailed = error =>
  error.message && error.message.includes('LOGIN_FAILED')

export const DumbTransferError = ({ onExit, error }) => {
  const { t } = useI18n()
  const loginFailed = isLoginFailed(error)
  return (
    <TransferState
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

export const TransferError = React.memo(DumbTransferError)
