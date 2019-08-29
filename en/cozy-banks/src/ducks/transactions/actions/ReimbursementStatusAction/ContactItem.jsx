import React from 'react'
import PropTypes from 'prop-types'
import { SubTitle } from 'cozy-ui/react/Text'
import cx from 'classnames'
import { ContactCard } from 'ducks/transactions/actions/ReimbursementStatusAction/Card'

const ContactItem = props => {
  const { brand, ...rest } = props

  return (
    <div {...rest}>
      <SubTitle className="u-mb-half">Contacter {brand.name}</SubTitle>
      {brand.contact.map((contact, index) => {
        const isLast = index === brand.contact.length - 1

        return (
          <ContactCard
            key={index}
            className={cx({ 'u-mb-half': !isLast })}
            type={contact.type}
            contact={contact}
          />
        )
      })}
    </div>
  )
}

ContactItem.propTypes = {
  brand: PropTypes.shape({
    name: PropTypes.string.isRequired,
    contact: PropTypes.arrayOf(PropTypes.object).isRequired
  })
}

export default ContactItem
