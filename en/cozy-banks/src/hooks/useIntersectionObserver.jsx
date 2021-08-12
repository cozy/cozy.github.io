import { useCallback, useEffect, useState, useRef } from 'react'
import 'intersection-observer'

const useIntersectionObserver = (observerOptions, handleIntersection) => {
  const [ref, setRef] = useState(null)
  const callbackRef = useRef()
  callbackRef.current = handleIntersection
  const handleRef = useCallback(node => {
    setRef(node)
  }, [])

  useEffect(() => {
    if (!ref) {
      return
    }
    const handleIntersectionCb = options => {
      callbackRef.current(options)
    }
    const o = new IntersectionObserver(handleIntersectionCb, observerOptions)
    o.observe(ref)
    return () => o.unobserve(ref)
  }, [observerOptions, ref])
  return handleRef
}
export default useIntersectionObserver
