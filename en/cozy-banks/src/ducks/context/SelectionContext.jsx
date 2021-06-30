import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  useContext,
  useMemo
} from 'react'

import flag from 'cozy-flags'

export const SelectionContext = createContext()

export const useSelectionContext = item => {
  const selectionContext = useContext(SelectionContext)

  const isItemSelected = useMemo(() => selectionContext.isSelected(item), [
    selectionContext,
    item
  ])

  const toggleSelection = useCallback(() => {
    if (selectionContext.isSelectionModeEnabled) {
      isItemSelected
        ? selectionContext.removeFromSelection(item)
        : selectionContext.addToSelection(item)
    }
  }, [isItemSelected, item, selectionContext])

  return { toggleSelection, isItemSelected, ...selectionContext }
}

// TODO: SelectionProvider stores the entire elements in an array
// instead of just their ids. This is not critical since we
// imagine that there are quite few elements.
// But an improvement would be to store only the ids.
const SelectionProvider = ({ children }) => {
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false)
  const [selected, setSelected] = useState([])
  const isSelectionModeEnabled = flag('banks.selectionMode.enabled')

  const activateSelectionMode = useCallback(
    () => isSelectionModeEnabled && setIsSelectionModeActive(true),
    [isSelectionModeEnabled]
  )

  const deactivateSelectionMode = () => setIsSelectionModeActive(false)

  const addToSelection = useCallback(
    item => {
      setSelected(v => [...v, item])
    },
    [setSelected]
  )

  const removeFromSelection = useCallback(
    item => {
      setSelected(selected.filter(e => e._id !== item._id))
    },
    [selected]
  )

  const emptySelection = useCallback(() => setSelected([]), [setSelected])

  const isSelected = useCallback(item => selected.includes(item), [selected])

  useEffect(() => {
    if (isSelectionModeActive && selected.length === 0) {
      deactivateSelectionMode()
    }
    if (!isSelectionModeActive && selected.length > 0) {
      activateSelectionMode()
    }
  }, [selected, activateSelectionMode, isSelectionModeActive])

  const value = useMemo(
    () => ({
      isSelectionModeActive,
      selected,
      addToSelection,
      isSelected,
      emptySelection,
      removeFromSelection,
      isSelectionModeEnabled
    }),
    [
      addToSelection,
      emptySelection,
      isSelected,
      isSelectionModeActive,
      isSelectionModeEnabled,
      removeFromSelection,
      selected
    ]
  )

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  )
}

export default SelectionProvider
