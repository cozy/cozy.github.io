import { useCallback, useEffect, useState } from 'react'
import 'intersection-observer'

const useIntersectionObserver = (observerOptions, handleIntersection) => {
  const [ref, setRef] = useState(null)
  const handleRef = useCallback(node => {
    setRef(node)
  }, [])

  useEffect(() => {
    if (!ref) {
      return
    }
    const o = new IntersectionObserver(handleIntersection, observerOptions)
    o.observe(ref)
    return () => o.unobserve(ref)
  }, [handleIntersection, observerOptions, ref])
  return handleRef
}
export default useIntersectionObserver
