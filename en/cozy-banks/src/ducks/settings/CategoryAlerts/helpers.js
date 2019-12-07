export const getAccountOrGroupChoiceFromAlert = alert => alert.accountOrGroup

export const getCategoryChoiceFromAlert = alert => ({
  id: alert.categoryId,
  isParent: alert.categoryIsParent
})

export const getMaxThresholdChoiceFromAlert = alert => alert.maxThreshold

export const updatedAlertFromCategoryChoice = (initialAlert, category) => ({
  ...initialAlert,
  categoryIsParent: !!category.isParent,
  categoryId: category.id
})

export const updatedAlertFromAccountOrGroupChoice = (
  initialAlert,
  accountOrGroup
) => ({
  ...initialAlert,
  accountOrGroup: accountOrGroup
    ? {
        _type: accountOrGroup._type,
        _id: accountOrGroup._id
      }
    : null
})

export const updatedAlertFromMaxThresholdChoice = (initialAlert, value) => ({
  ...initialAlert,
  maxThreshold: parseInt(value)
})
