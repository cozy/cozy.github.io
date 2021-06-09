import { useRef } from 'react'

/**
 * Used to store the last value that passes a condition
 * Useful to keep a reference on a query while another
 * one is loading
 */
const useLast = (value, condition) => {
  const last = useRef(null)
  if (condition(last.current, value)) {
    last.current = value
  }
  return last.current
}

export default useLast
