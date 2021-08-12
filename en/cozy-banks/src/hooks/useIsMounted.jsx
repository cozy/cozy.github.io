import { useRef, useEffect } from 'react'

const useIsMounted = () => {
  const mounted = useRef()
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  return mounted
}

export default useIsMounted
