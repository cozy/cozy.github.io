import React from 'react'
import Icon from 'cozy-ui/react/Icon'
import Modal, { ModalHeader, ModalDescription } from 'cozy-ui/react/Modal'
import { Media, Bd, Img } from 'cozy-ui/react/Media'
import palette from 'cozy-ui/react/palette'
import MultiSelect from 'components/MultiSelect'

import styles from 'components/PopupSelect/styles.styl'

const PopupTitle = ({ showBack, onClickBack, title }) => (
  <Media>
    {showBack && (
      <Img className={styles.PopupSelect__back} onClick={onClickBack}>
        <Icon icon="left" color={palette['coolGrey']} />
      </Img>
    )}
    <Bd>
      <h2>{title}</h2>
    </Bd>
  </Media>
)

const PopupModalHeader = ({ showBack, onClickBack, title }) => {
  return (
    <div className={styles.PopupSelect__title}>
      <ModalHeader>
        <PopupTitle
          showBack={showBack}
          onClickBack={onClickBack}
          title={title}
        />
      </ModalHeader>
    </div>
  )
}

const PopupModalDescription = ({ children }) => (
  <div className={styles.PopupSelect__content}>
    <ModalDescription className="u-pb-0">{children}</ModalDescription>
  </div>
)

const PopupSelectModal = props => {
  return (
    <Modal
      closeBtnClassName={props.closeBtnClassName}
      overflowHidden
      dismissAction={props.onCancel}
      into="body"
    >
      <MultiSelect
        {...props}
        HeaderComponent={PopupModalHeader}
        ContentComponent={PopupModalDescription}
      />
    </Modal>
  )
}

export default PopupSelectModal
