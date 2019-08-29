import React from 'react'
import Modal, { ModalHeader, ModalContent } from 'cozy-ui/react/Modal'
import styles from 'components/PageModal/PageModalDesktop.styl'

const PageModalDesktop = props => {
  const { title, children, ...rest } = props

  return (
    <Modal
      {...rest}
      closeBtnClassName={styles.PageModalDesktop__cross}
      className={styles.PageModalDesktop}
    >
      <ModalHeader className={styles.PageModalDesktop__header}>
        {title}
      </ModalHeader>
      <ModalContent className={styles.PageModalDesktop__content}>
        {children}
      </ModalContent>
    </Modal>
  )
}

export default PageModalDesktop
