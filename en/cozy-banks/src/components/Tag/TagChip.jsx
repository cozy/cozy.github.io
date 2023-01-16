import React from 'react'
import { useNavigate } from 'react-router-dom'

import Chip from 'cozy-ui/transpiled/react/Chips'
import Icon from 'cozy-ui/transpiled/react/Icon'
import TagIcon from 'cozy-ui/transpiled/react/Icons/Tag'

import { TAGS_DOCTYPE } from 'doctypes'
import useDocument from 'components/useDocument'
import { removeTagRelationshipFromTransaction } from 'ducks/transactions/helpers'
import { trackEvent } from 'ducks/tracking/browser'

const TagChip = ({
  className,
  transaction,
  tag,
  clickable,
  deletable,
  withIcon
}) => {
  const tagFromDoctype = useDocument(TAGS_DOCTYPE, tag._id)
  const navigate = useNavigate()

  const handleDelete = deletable
    ? () => {
        trackEvent({ name: 'retrait-label' })
        removeTagRelationshipFromTransaction(transaction, tagFromDoctype)
      }
    : undefined

  const handleClick = ev => {
    ev?.preventDefault() // works only on desktop, hammer is used to prevent click on mobile
    if (clickable) {
      navigate(`/tag/${tag._id}`)
    }
  }

  return (
    <Chip
      style={{ marginBottom: '0.25rem', marginRight: '0.25rem' }}
      className={className}
      {...(withIcon && {
        icon: <Icon className="u-ml-half" icon={TagIcon} />
      })}
      label={tag.label}
      clickable
      onDelete={handleDelete}
      onClick={handleClick}
    />
  )
}

TagChip.defaultProps = {
  withIcon: true
}

export default TagChip
