import { useState, useCallback } from 'react'
import useIntersectionObserver from 'hooks/useIntersectionObserver'

const defaultObserverOptions = {
  threshold: [0, 1]
}

const useVisible = (
  initialVisible,
  observerOptions = defaultObserverOptions
) => {
  const [visible, setVisible] = useState(initialVisible)
  const handleIntersection = useCallback(
    entries => {
      if (entries[0].intersectionRatio > 0 && !visible) {
        setVisible(true)
      }
    },
    [setVisible, visible]
  )
  const ref = useIntersectionObserver(observerOptions, handleIntersection)
  return [ref, visible]
}

export default useVisible
