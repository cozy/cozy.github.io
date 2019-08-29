import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import Modal, { ModalDescription } from 'cozy-ui/react/Modal'
import Button from 'cozy-ui/react/Button'
import Text, { Title, Caption } from 'cozy-ui/react/Text'
import Icon from 'cozy-ui/react/Icon'
import iconCollectAccount from 'assets/icons/icon-collect-account.svg'
import styles from 'ducks/transactions/TransactionActions.styl'

const InformativeModal = ({
  onCancel,
  onConfirm,
  title,
  description,
  caption,
  cancelText,
  confirmText
}) => (
  <Modal into="body" mobileFullscreen dismissAction={onCancel}>
    <ModalDescription className={styles.InformativeModal__content}>
      <Icon
        icon={iconCollectAccount}
        width={192}
        height={112}
        className={styles.InformativeModal__illustration}
      />
      <Title tag="h2" className={cx('u-mt-1-half', 'u-mb-0', 'u-ta-center')}>
        {title}
      </Title>
      <Text tag="p">{description}</Text>
      <div className={styles.InformativeModal__bottom}>
        <Caption tag="p" className={cx('u-mt-0', 'u-mb-1')}>
          {caption}
        </Caption>
        <div className={styles.InformativeModal__buttons}>
          <Button onClick={onCancel} theme="secondary" label={cancelText} />
          <Button onClick={onConfirm} label={confirmText} />
        </div>
      </div>
    </ModalDescription>
  </Modal>
)

InformativeModal.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  caption: PropTypes.string.isRequired,
  cancelText: PropTypes.string.isRequired,
  confirmText: PropTypes.string.isRequired
}

export default InformativeModal
