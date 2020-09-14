import React from 'react'
import cx from 'classnames'
import { Modal, ModalHeader, BarButton } from 'cozy-ui/transpiled/react'
import styles from 'components/PageModal/Page.styl'
import iconArrowLeft from 'assets/icons/icon-arrow-left.svg'

export const PageBackButton = ({ onClick }) => (
  <BarButton
    icon={iconArrowLeft}
    onClick={onClick}
    className={styles.Page__BackButton}
  />
)

export const PageHeader = ({ children }) => {
  return <ModalHeader className={styles.Page__header}>{children}</ModalHeader>
}

export const Page = ({ children, className, ...props }) => {
  return (
    <Modal
      mobileFullscreen
      closable={false}
      into="body"
      className={cx(styles.Page, className)}
      overlayClassName={styles.Page__Overlay}
      wrapperClassName={styles.Page__Wrapper}
      {...props}
    >
      {children}
    </Modal>
  )
}

export default Page
