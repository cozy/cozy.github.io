import { useState, useCallback } from 'react'

/**
 * Replace item in arr, finding item through idFn.
 * If previous item cannot be found, the new item is pushed at the
 * end of the array.
 */
const replaceBy = (arr, item, idFn) => {
  const id = idFn(item)
  const index = arr.findIndex(x => idFn(x) === id)
  return index !== -1
    ? [...arr.slice(0, index), item, ...arr.slice(index + 1)]
    : [...arr, item]
}

const useList = ({
  list: initialList,
  onUpdate,
  onError,
  getId,
  getNextId
}) => {
  const [list, setList] = useState(initialList)

  const updateList = useCallback(
    async updatedList => {
      setList(updatedList)

      try {
        await onUpdate(updatedList)
      } catch (e) {
        setList(list)
        onError(e)
      }
    },
    [onUpdate, list, onError]
  )

  const createOrUpdate = useCallback(
    async updatedItem => {
      if (updatedItem.id === undefined) {
        updatedItem.id = getNextId(list)
      }
      const updatedList = replaceBy(list, updatedItem, getId)
      await updateList(updatedList)
    },
    [list, getId, updateList, getNextId]
  )

  const remove = async itemToRemove => {
    const idToRemove = getId(itemToRemove)
    const updatedList = list.filter(item => getId(item) !== idToRemove)
    await updateList(updatedList)
  }

  return [list, createOrUpdate, remove]
}

export default useList
