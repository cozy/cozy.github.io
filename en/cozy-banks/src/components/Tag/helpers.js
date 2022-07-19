export const makeTagsToAdd = ({ transactionTags, selectedTagIds, allTags }) => {
  const tagIdsToAdd = selectedTagIds.filter(
    selectedTagId =>
      !transactionTags.some(
        transactionTag => transactionTag._id === selectedTagId
      )
  )

  return tagIdsToAdd.map(tagId => allTags.find(tag => tag._id === tagId))
}

export const makeTagsToRemove = ({
  transactionTags,
  selectedTagIds,
  allTags
}) => {
  const tagsToRemove = transactionTags.filter(
    transactionTag =>
      !selectedTagIds.some(
        selectedTagId => selectedTagId === transactionTag._id
      )
  )

  return tagsToRemove.map(tagToRemove =>
    allTags.find(tag => tag._id === tagToRemove._id)
  )
}

export const countTransactions = tag => {
  return tag.transactions?.count || 0
}
