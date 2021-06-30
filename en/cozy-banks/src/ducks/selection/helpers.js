import GraphCircleIcon from 'cozy-ui/transpiled/react/Icons/GraphCircle'

export const makeSelectionBarActions = showTransactionCategoryModal => {
  return {
    categorize: {
      action: () => showTransactionCategoryModal(),
      displayCondition: selected => selected.length > 0,
      icon: GraphCircleIcon
    }
  }
}
