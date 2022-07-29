import React, { useState } from 'react'
import PropTypes from 'prop-types'

import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import { Dialog } from 'cozy-ui/transpiled/react/CozyDialogs'

import { useHistory } from 'components/RouterContext'
import TagDialogTitle from 'ducks/tags/TagDialogTitle'
import TagDialogContent from 'ducks/tags/TagDialogContent'

const TagDialog = ({ tag }) => {
  const { isMobile } = useBreakpoints()
  const history = useHistory()
  const [isRenameModalOpened, setIsRenameModalOpened] = useState(false)
  const [isDeleteModalOpened, setIsDeleteModalOpened] = useState(false)

  const amount = tag.transactions.data.reduce((amount, transaction) => {
    return amount + transaction.amount
  }, 0)
  const currency = 'EUR'

  const handleDialogBack = () => {
    history.goBack()
  }

  const title = (
    <TagDialogTitle
      tag={tag}
      amount={amount}
      currency={currency}
      setIsRenameModalOpened={setIsRenameModalOpened}
      setIsDeleteModalOpened={setIsDeleteModalOpened}
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
          onBack={handleDialogBack}
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
  tag: PropTypes.object.required
}

export default TagDialog
