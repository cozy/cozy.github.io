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
    return (
      <Modal
        mobileFullscreen
        dismissAction={this.props.dismissAction}
        closable={false}
        into="body"
        className={cx(styles.Page, this.props.className)}
        overlayClassName={styles.Page__Overlay}
        wrapperClassName={styles.Page__Wrapper}
      >
        <ModalHeader className={styles.Page__title}>
          <BackButton onClick={this.props.dismissAction} />
          {this.props.title}
        </ModalHeader>
        <ModalContent className={styles.Page__content}>
          {this.props.children}
        </ModalContent>
      </Modal>
    )
  }
}

export default Page
