import { useMemo, useState } from 'react'

const useStickyState = (defaultValue, localStorageKey) => {
  if (!localStorageKey) {
    throw new Error('Must pass a localStorageKey to useStickyState')
  }
  const savedValue = useMemo(() => {
    const savedValue = localStorage.getItem(localStorageKey)
    return savedValue ? JSON.parse(savedValue) : null
  }, [localStorageKey])
  const [value, rawSetValue] = useState(savedValue || defaultValue)
  const setValue = newValue => {
    localStorage.setItem(localStorageKey, JSON.stringify(newValue))
    rawSetValue(newValue)
  }

  const clearValue = () => {
    localStorage.removeItem(localStorageKey)
  }

  return [value, setValue, clearValue]
}

export default useStickyState
