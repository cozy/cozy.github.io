import React, { Component } from 'react'
import SharingIcon from 'components/SharingIcon'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/deprecated/Media'
import styles from 'components/AccountSharingStatus/AccountSharingStatus.styl'

const ownerRx = /\((.*)\)/ // find the word in parenthesis
const getOwner = account => {
  if (!account) {
    return
  }
  const match = ownerRx.exec(account.label)
  return match ? match[1] : account.label.split(' ').slice(-1)[0]
}

class AccountSharingStatus extends Component {
  render() {
    const { sharingInfo, withText, tooltip } = this.props
    const info = (sharingInfo && sharingInfo.info) || {}

    const isShared = info.recipients && info.recipients.length > 0
    const iconProps = {}

    if (info.owner) {
      iconProps.to = true
    } else if (info.recipients && info.recipients.length) {
      iconProps.from = true
    }

    const owner = getOwner(info.account)

    const rhProps = tooltip
      ? {
          'data-rh-cls': styles['account-sharing-tooltip'],
          'data-rh-at': 'top',
          'data-rh': `Partagé par ${owner}`
        }
      : {}

    return isShared ? (
      <Media {...rhProps}>
        <Img>
          <SharingIcon {...iconProps} />
        </Img>
        <Bd>{withText && <span>Partagé par {owner}</span>}</Bd>
      </Media>
    ) : null
  }
}

export default AccountSharingStatus
