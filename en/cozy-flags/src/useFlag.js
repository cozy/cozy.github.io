import { useState, useEffect } from 'react'

import flag from './flag'

export default function useFlag(name) {
  const [flagValue, setFlag] = useState(flag(name))
  useEffect(() => {
    const handleChange = changed => {
      if (changed === name) {
        setFlag(flag(name))
      }
    }
    flag.store.on('change', handleChange)
    return () => {
      flag.store.removeListener('change', handleChange)
    }
  }, [setFlag, name])
  return flagValue
}
