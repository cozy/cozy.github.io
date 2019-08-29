import React from 'react'
import Modal, { ModalDescription } from 'cozy-ui/react/Modal'
import Spinner from 'cozy-ui/react/Spinner'
import { translate } from 'cozy-ui/react/I18n'
import styles from 'components/LogoutModal/LogoutModal.styl'

function LogoutModal(props) {
  const { t } = props

  return (
    <Modal
      into="#logout-modal"
      mobileFullscreen
      closable={false}
      containerClassName={styles.LogoutModal}
    >
      <ModalDescription className={styles.LogoutModal__description}>
        <Spinner size="xxlarge" />
        <p>{t('LogoutModal.message')}</p>
      </ModalDescription>
    </Modal>
  )
}

export default translate()(LogoutModal)
