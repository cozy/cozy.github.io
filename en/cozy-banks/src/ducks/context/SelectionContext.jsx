import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useMemo
} from 'react'

import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

export const SelectionContext = createContext()

export const useSelectionContext = () => {
  const context = useContext(SelectionContext)
  if (!context)
    throw new Error(
      'SelectionContext is unavailable. There is no Selection provider, or it is not loaded yet.'
    )
  return context
}

// TODO: SelectionProvider stores the entire elements in an array
// instead of just their ids. This is not critical since we
// imagine that there are quite few elements.
// But an improvement would be to store only the ids.
const SelectionProvider = ({ children }) => {
  const { isDesktop } = useBreakpoints()
  const [selected, setSelected] = useState([])
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false)

  const isSelected = useCallback(item => selected.includes(item), [selected])

  const emptySelection = useCallback(() => setSelected([]), [setSelected])

  const emptyAndDeactivateSelection = useCallback(() => {
    emptySelection()
    setIsSelectionModeActive(false)
  }, [emptySelection])

  const fillSelectionWith = useCallback(arr => setSelected(arr), [setSelected])

  const toggleSelection = useCallback(
    item => {
      !isSelectionModeActive && setIsSelectionModeActive(true)

      return setSelected(selected => {
        const found = selected.includes(item)
        const nextSelected = found
          ? selected.filter(elem => elem !== item)
          : [...selected, item]

        if (isDesktop && found && selected.length === 1) {
          setIsSelectionModeActive(false)
        }

        return nextSelected
      })
    },
    [isDesktop, isSelectionModeActive]
  )

  const value = useMemo(
    () => ({
      selected,
      isSelectionModeActive,
      setIsSelectionModeActive,
      isSelected,
      emptySelection,
      emptyAndDeactivateSelection,
      toggleSelection,
      fillSelectionWith
    }),
    [
      selected,
      isSelectionModeActive,
      isSelected,
      emptySelection,
      emptyAndDeactivateSelection,
      toggleSelection,
      fillSelectionWith
    ]
  )

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  )
}

export default SelectionProvider
