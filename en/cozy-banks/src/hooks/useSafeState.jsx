import { useState, useCallback } from 'react'
import useIsMounted from './useIsMounted'

const useSafeState = initialState => {
  const mounted = useIsMounted()
  const [state, setState] = useState(initialState)
  const setSafeState = useCallback(
    newState => {
      if (mounted.current) {
        setState(newState)
      }
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )
  return [state, setSafeState]
}

export default useSafeState
