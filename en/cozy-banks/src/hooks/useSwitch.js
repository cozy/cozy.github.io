import { useState } from 'react'

/** Hook to manipulate a Boolean variable */
const useSwitch = initialState => {
  const [state, setState] = useState(initialState)
  const toggleOn = () => setState(true)
  const toggleOff = () => setState(false)
  return [state, toggleOn, toggleOff]
}

export default useSwitch
