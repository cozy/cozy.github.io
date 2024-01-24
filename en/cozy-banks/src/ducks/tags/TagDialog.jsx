import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'

import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { Dialog } from 'cozy-ui/transpiled/react/CozyDialogs'

import TagDialogTitle from 'ducks/tags/TagDialogTitle'
import TagDialogContent from 'ducks/tags/TagDialogContent'

const TagDialog = ({ tag }) => {
  const { isMobile } = useBreakpoints()
  const navigate = useNavigate()
  const [isRenameModalOpened, setIsRenameModalOpened] = useState(false)
  const [isDeleteModalOpened, setIsDeleteModalOpened] = useState(false)

  const amount = tag.transactions.data.reduce((amount, transaction) => {
    return amount + transaction.amount
  }, 0)
  const currency = 'EUR'

  const handleDialogClose = () => {
    navigate(-1) // TODO: find a way to use paths instead
  }

  const title = (
    <TagDialogTitle
      tag={tag}
      amount={amount}
      currency={currency}
      setIsRenameModalOpened={setIsRenameModalOpened}
      setIsDeleteModalOpened={setIsDeleteModalOpened}
      onClose={handleDialogClose}
    />
  )

  const content = (
    <TagDialogContent
      tag={tag}
      isRenameModalOpened={isRenameModalOpened}
      setIsRenameModalOpened={setIsRenameModalOpened}
      isDeleteModalOpened={isDeleteModalOpened}
      setIsDeleteModalOpened={setIsDeleteModalOpened}
    />
  )

  if (isMobile) {
    return (
      <>
        <Dialog
          open
          size="large"
          disableTitleAutoPadding
          disableGutters
          title={title}
          content={content}
        />
      </>
    )
  }

  return (
    <>
      {title}
      {content}
    </>
  )
}

TagDialog.propTypes = {
  tag: PropTypes.object.isRequired
}

export default TagDialog
