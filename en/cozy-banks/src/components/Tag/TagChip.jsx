import React from 'react'

import Chip from 'cozy-ui/transpiled/react/Chips'
import Icon from 'cozy-ui/transpiled/react/Icon'
import TagIcon from 'cozy-ui/transpiled/react/Icons/Tag'

import { TAGS_DOCTYPE } from 'doctypes'
import useDocument from 'components/useDocument'
import { removeTag } from 'ducks/transactions/helpers'

const TagChip = ({ className, transaction, tag, clickable, deletable }) => {
  const tagFromDoctype = useDocument(TAGS_DOCTYPE, tag._id)

  const handleDelete = deletable
    ? () => removeTag(transaction, tagFromDoctype)
    : undefined

  const handleClick = ev => {
    ev?.preventDefault() // works only on desktop, hammer is used to prevent click on mobile
    clickable && alert('TODO click!') // TODO: should open tags management url
  }

  return (
    <Chip
      style={{ marginBottom: '0.25rem', marginRight: '0.25rem' }}
      className={className}
      icon={<Icon className="u-ml-half" icon={TagIcon} />}
      label={tag.label}
      clickable
      onDelete={handleDelete}
      onClick={handleClick}
    />
  )
}

export default TagChip