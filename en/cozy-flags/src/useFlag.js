import { useState, useMemo } from 'react'

import flag from './flag'

export default function useFlag(name) {
  const [flagValue, setFlag] = useState(flag(name))
  useMemo(() => {
    flag.store.on('change', changed => {
      if (changed === name) {
        setFlag(flag(name))
      }
    })
  }, [setFlag, name])
  return flagValue
}
