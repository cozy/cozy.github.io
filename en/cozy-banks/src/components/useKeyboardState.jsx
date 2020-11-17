import { useEffect, useState } from 'react'

const useKeyboardState = () => {
  const [showing, setShow] = useState(false)
  useEffect(() => {
    const handleShow = () => setShow(true)
    const handleHide = () => setShow(false)

    if (window.Keyboard && typeof cordova !== 'undefined') {
      window.addEventListener('keyboardDidShow', handleShow)
      window.addEventListener('keyboardDidHide', handleHide)
    }

    return () => {
      window.removeEventListener('keyboardDidShow', handleShow)
      window.removeEventListener('keyboardDidHide', handleHide)
    }
  }, [setShow])

  return showing
}

export default useKeyboardState
