import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'

const useDelay = delay => {
  // ok is true when delay has elapsed
  const [ok, setOK] = useState(delay === 0)
  // Pass empty dep list to useEffect to have a behavior similar to
  // componentDid{Mount,Unmount}
  // https://fr.reactjs.org/docs/hooks-effect.html#tip-optimizing-performance-by-skipping-effects
  useEffect(
    () => {
      function setOKToTrue() {
        setOK(true)
      }
      const timeout = delay === 0 ? null : setTimeout(setOKToTrue, delay)
      return () => {
        clearTimeout(timeout)
      }
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  return ok
}

/**
 * Delays rendering of its children
 * @param  {Element} options.fallback - Simple component used while delay has not elapsed
 * @param  {Element} options.children - Will be rendered after <delay>ms have passed
 * @param  {Number} options.delay    - Delay to render children in ms
 */
const Delayed = ({ fallback, children, delay }) => {
  const ok = useDelay(delay)
  if (ok) {
    return children
  } else {
    return fallback
  }
}

Delayed.defaultProps = {
  fallback: null
}

Delayed.propTypes = {
  fallback: PropTypes.element
}

export default Delayed
