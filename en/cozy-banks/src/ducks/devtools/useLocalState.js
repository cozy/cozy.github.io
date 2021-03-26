import { useState, useCallback, useEffect } from 'react'

const useLocalState = (key, initialState) => {
  const [state, setState] = useState(() => {
    const item = localStorage.getItem(key)
    try {
      return item !== null ? JSON.parse(item) : initialState
    } catch (e) {
      return initialState
    }
  })

  const setLocalState = useCallback(
    newState => {
      setState(newState)
    },
    [setState]
  )

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state))
  }, [key, state])

  return [state, setLocalState]
}

export default useLocalState
