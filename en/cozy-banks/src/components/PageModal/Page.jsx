import React, { Component } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import Icon from 'cozy-ui/react/Icon'
import Modal, { ModalHeader, ModalContent } from 'cozy-ui/react/Modal'
import palette from 'cozy-ui/react/palette'
import styles from 'components/PageModal/Page.styl'
import iconArrowLeft from 'assets/icons/icon-arrow-left.svg'

const BackButton = ({ onClick }) => (
  <button type="button" onClick={onClick} className={styles.Page__BackButton}>
    <Icon icon={iconArrowLeft} width={16} color={palette.coolGrey} />
  </button>
)

class Page extends Component {
  static propTypes = {
    className: PropTypes.string,
    dismissAction: PropTypes.func.isRequired,
    title: PropTypes.node.isRequired
  }

  render() {
    const { dismissAction, title, className, children } = this.props
    return (
      <Modal
        mobileFullscreen
        dismissAction={dismissAction}
        closable={false}
        into="body"
        title={title}
        className={cx(styles.Page, className)}
        overlayClassName={styles.Page__Overlay}
        wrapperClassName={styles.Page__Wrapper}
      >
        <ModalHeader className={styles.Page__title}>
          <BackButton onClick={dismissAction} />
          {title}
        </ModalHeader>
        <ModalContent className={styles.Page__content}>{children}</ModalContent>
      </Modal>
    )
  }
}

export default Page
