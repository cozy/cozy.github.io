import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import { ContactCard } from 'ducks/transactions/actions/ReimbursementStatusAction/Card'
import Typography from 'cozy-ui/transpiled/react/Typography'

const ContactItem = props => {
  const { brand, ...rest } = props

  return (
    <div {...rest}>
      <Typography className="u-mb-half" variant="h5">
        Contacter {brand.name}
      </Typography>
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
