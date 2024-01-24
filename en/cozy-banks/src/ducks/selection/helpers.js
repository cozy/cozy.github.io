import { useCallback, useMemo } from 'react'

import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import GraphCircleIcon from 'cozy-ui/transpiled/react/Icons/GraphCircle'
import SelectAllIcon from 'cozy-ui/transpiled/react/Icons/SelectAll'

import { useSelectionContext } from 'ducks/context/SelectionContext'

export const useSelectionBarActions = ({
  items,
  showTransactionCategoryModal
}) => {
  const { isDesktop } = useBreakpoints()
  const { emptySelection, emptyAndDeactivateSelection, fillSelectionWith } =
    useSelectionContext()

  const fillSelection = useCallback(
    () => fillSelectionWith(items),
    [fillSelectionWith, items]
  )

  const unSelectAllAction = useCallback(() => {
    isDesktop ? emptyAndDeactivateSelection() : emptySelection()
  }, [emptyAndDeactivateSelection, emptySelection, isDesktop])

  const actions = useMemo(
    () => ({
      categorize: {
        action: () => showTransactionCategoryModal(),
        displayCondition: selected => selected.length > 0,
        icon: GraphCircleIcon
      },
      selectAll: {
        action: () => fillSelection(),
        displayCondition: selected => selected.length !== items.length,
        icon: SelectAllIcon,
        disabled: () => false
      },
      unselectAll: {
        action: () => unSelectAllAction(),
        displayCondition: selected => selected.length === items.length,
        icon: SelectAllIcon
      }
    }),
    [
      fillSelection,
      items.length,
      showTransactionCategoryModal,
      unSelectAllAction
    ]
  )

  return actions
}
