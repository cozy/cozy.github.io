import React from 'react'
import Padded from 'components/Spacing/Padded'
import { translate, Text, Button } from 'cozy-ui/transpiled/react'

import styles from 'ducks/transfers/styles.styl'
import transferDoneImg from 'assets/transfer-done.jpg'
import transferErrorImg from 'assets/transfer-error.jpg'
import Title from 'ducks/transfers/steps/Title'

const TransferStateModal = props => (
  <Padded className={styles.TransferStateModal}>
    <Title className="u-mb-1-half">{props.title}</Title>
    <img
      style={{ maxHeight: '7.5rem' }}
      className="u-mb-1-half"
      src={props.img}
    />
    <Text className="u-mb-1-half">{props.description}</Text>
    <Button
      extension="full"
      className="u-mb-half"
      onClick={props.onClickPrimaryButton}
      label={props.primaryLabel}
    />
  </Padded>
)

export const TransferSuccess = React.memo(
  translate()(({ t, onExit }) => (
    <TransferStateModal
      title={t('Transfer.success.title')}
      img={transferDoneImg}
      description={t('Transfer.success.description')}
      onClickPrimaryButton={onExit}
      primaryLabel={t('Transfer.exit')}
    />
  ))
)

const isLoginFailed = error =>
  error.message && error.message.includes('LOGIN_FAILED')

export const DumbTransferError = ({ t, onExit, error }) => {
  const loginFailed = isLoginFailed(error)
  return (
    <TransferStateModal
      title={t('Transfer.error.title')}
      img={transferErrorImg}
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

export const TransferError = React.memo(translate()(DumbTransferError))
