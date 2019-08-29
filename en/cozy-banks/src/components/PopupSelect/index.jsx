import React, { Component } from 'react'
import cx from 'classnames'
import Icon from 'cozy-ui/react/Icon'
import Modal, { ModalHeader, ModalDescription } from 'cozy-ui/react/Modal'
import { Media, Bd, Img } from 'cozy-ui/react/Media'
import palette from 'cozy-ui/react/palette'

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

const PopupRow = ({ isSelected, icon, label, hasArrow, onClick }) => (
  <Media
    className={cx(
      styles.PopupSelect__row,
      'u-ph-1 u-pv-half',
      isSelected ? ' u-text-bold' : ''
    )}
    onClick={onClick}
  >
    {icon && <Img className="u-pr-1">{icon}</Img>}
    <Bd className="u-ellipsis">{label}</Bd>
    {hasArrow && (
      <Img className="u-pl-1">
        <Icon icon="right" color={palette['coolGrey']} />
      </Img>
    )}
  </Media>
)

class PopupSelect extends Component {
  constructor(props) {
    super(props)
    this.state = {
      history: [props.options]
    }
  }

  handleBack = () => {
    const [item, ...newHistory] = this.state.history
    this.setState({
      history: newHistory
    })
    return item
  }

  handleSelect = item => {
    if (item.children && item.children.length > 0) {
      const newHistory = [item, ...this.state.history]
      this.setState({
        history: newHistory
      })
    } else {
      this.props.onSelect(item)
    }
  }

  render() {
    const { history } = this.state
    const current = history[0]
    const children = current.children || []
    return (
      <Modal
        closeBtnClassName={this.props.closeBtnClassName}
        overflowHidden
        dismissAction={this.props.onCancel}
        into="body"
      >
        <div className={styles.PopupSelect__title}>
          <ModalHeader>
            <PopupTitle
              title={current.title}
              showBack={history.length > 1}
              onClickBack={this.handleBack}
            />
          </ModalHeader>
        </div>
        <ModalDescription className="u-pb-0">
          <div className={styles.PopupSelect__content}>
            {children.map(item => (
              <PopupRow
                key={item.title}
                isSelected={this.props.isSelected(item)}
                icon={item.icon}
                label={item.title}
                onClick={() => this.handleSelect(item)}
                hasArrow={item.children && item.children.length > 0}
              />
            ))}
          </div>
        </ModalDescription>
      </Modal>
    )
  }
}

export default PopupSelect
