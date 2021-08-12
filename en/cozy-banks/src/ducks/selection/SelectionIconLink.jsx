import React, { useCallback } from 'react'

import IconButton from 'cozy-ui/transpiled/react/IconButton'
import Icon from 'cozy-ui/transpiled/react/Icon'
import CheckboxIcon from 'cozy-ui/transpiled/react/Icons/Checkbox'

const SelectionIconLink = ({
  isSelectionModeEnabled,
  isSelectionModeActive,
  setIsSelectionModeActive
}) => {
  const handleClick = useCallback(() => {
    if (!isSelectionModeActive) setIsSelectionModeActive(true)
  }, [isSelectionModeActive, setIsSelectionModeActive])

  if (!isSelectionModeEnabled) return null
  return (
    <IconButton className="u-mr-half" onClick={handleClick}>
      <Icon icon={CheckboxIcon} />
    </IconButton>
  )
}

export default React.memo(SelectionIconLink)
