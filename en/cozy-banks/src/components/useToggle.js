import { useState, useCallback } from 'react'

const useToggle = initial => {
  const [val, setVal] = useState(initial)
  const setTrue = useCallback(() => setVal(true), [setVal])
  const setFalse = useCallback(() => setVal(false), [setVal])
  return [val, setTrue, setFalse]
}

export default useToggle
