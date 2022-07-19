import React, { useState } from 'react'

import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

import TagAddModal from 'components/Tag/TagAddModal'
// import TagBottomSheet from 'components/Tag/TagBottomSheet'
import TagAddChip from 'components/Tag/TagAddChip'

const TagAdd = ({ transaction, disabled }) => {
  const { isMobile } = useBreakpoints()
  const [showModalOrBottomSheet, setShowModalOrBottomSheet] = useState(false)

  const toggleModal = () => setShowModalOrBottomSheet(prev => !prev)

  const handleClick = () => {
    !disabled && toggleModal()
  }

  // TODO: should work on BottomSheet cozy-ui component first
  // this is the next step !
  // const ModalOrBottomSheet = isMobile ? TagBottomSheet : TagAddModal
  const ModalOrBottomSheet = isMobile ? TagAddModal : TagAddModal

  return (
    <>
      <TagAddChip disabled={disabled} onClick={handleClick} />
      {showModalOrBottomSheet && (
        <ModalOrBottomSheet transaction={transaction} onClose={toggleModal} />
      )}
    </>
  )
}

export default TagAdd
