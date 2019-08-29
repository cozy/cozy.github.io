import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'cozy-ui/react'
import UICard from 'cozy-ui/react/Card'
import { Caption, Text } from 'cozy-ui/react/Text'
import Icon, { iconPropType } from 'cozy-ui/react/Icon'
import cx from 'classnames'
import styles from 'ducks/transactions/actions/ReimbursementStatusAction/Card.styl'
import { getPlatform } from 'cozy-device-helper'

// TODO use icons from cozy-ui when https://github.com/cozy/cozy-ui/pull/983
// has been merged
import iconPhone from 'assets/icons/icon-phone.svg'
import iconEmail from 'assets/icons/icon-email.svg'

const Card = props => {
  const { title, caption, icon, className, ...rest } = props

  return (
    <UICard className={cx(styles.Card, className)} {...rest}>
      <Icon icon={icon} size={16} color="var(--coolGrey)" />
      <div className="u-ml-1">
        <Text>{title}</Text>
        <Caption>{caption}</Caption>
      </div>
    </UICard>
  )
}

Card.propTypes = {
  icon: iconPropType.isRequired,
  title: PropTypes.string.isRequired,
  caption: PropTypes.node.isRequired
}

export const DumbPhoneCard = props => {
  const { contact, t, ...rest } = props
  const href = `tel:${contact.number}`
  const caption = contact.price ? (
    <>
      {contact.price}
      {t('ReimbursementStatusModal.contact.phoneCallPrice')}
    </>
  ) : (
    t('ReimbursementStatusModal.contact.phoneCallFree')
  )

  return (
    <Card
      href={href}
      title={contact.number}
      caption={caption}
      icon={iconPhone}
      tag="a"
      {...rest}
    />
  )
}

const phoneContactShape = PropTypes.shape({
  price: PropTypes.string,
  number: PropTypes.string.isRequired
})

DumbPhoneCard.propTypes = {
  contact: phoneContactShape.isRequired,
  t: PropTypes.func.isRequired
}

export const PhoneCard = translate()(DumbPhoneCard)

export const DumbWebCard = props => {
  const { contact, t, ...rest } = props
  const caption = new URL(contact.href).hostname

  return (
    <Card
      href={contact.href}
      title={t(`ReimbursementStatusModal.contact.actions.${contact.action}`)}
      caption={caption}
      icon={iconEmail}
      target="_blank"
      tag="a"
      {...rest}
    />
  )
}

const webContactShape = PropTypes.shape({
  href: PropTypes.string.isRequired,
  action: PropTypes.string.isRequired
})

DumbWebCard.propTypes = {
  contact: webContactShape.isRequired,
  t: PropTypes.func.isRequired
}

export const WebCard = translate()(DumbWebCard)

export const DumbAppCard = props => {
  const { contact, t, ...rest } = props

  if (getPlatform() !== contact.platform) {
    return null
  }

  return (
    <Card
      href={contact.href}
      title={t('ReimbursementStatusModal.contact.openApp.title')}
      caption={t('ReimbursementStatusModal.contact.openApp.caption')}
      icon="phone"
      target="_blank"
      tag="a"
      {...rest}
    />
  )
}

const appContactShape = PropTypes.shape({
  platform: PropTypes.oneOf(['android', 'ios']).isRequired,
  href: PropTypes.string.isRequired
})

DumbAppCard.propTypes = {
  contact: appContactShape.isRequired,
  t: PropTypes.func.isRequired
}

export const AppCard = translate()(DumbAppCard)

export const ContactCard = props => {
  const { type, ...rest } = props

  switch (type) {
    case 'phone':
      return <PhoneCard {...rest} />

    case 'web':
      return <WebCard {...rest} />

    case 'app':
      return <AppCard {...rest} />

    default:
      return null
  }
}

ContactCard.propTypes = {
  type: PropTypes.oneOf(['phone', 'web', 'app']).isRequired,
  contact: PropTypes.object.isRequired
}
