import { useEffect } from 'react'

const lockedHTML = `html { position: fixed; overflow: hidden !important; }`

const lockSaveAndRestoreScrollFx = () => {
  const node = document.scrollingElement
  const scrollLeft = node && node.scrollLeft
  const scrollTop = node && node.scrollTop

  const sheetNode = document.createElement('style')
  document.head.appendChild(sheetNode)
  sheetNode.sheet.insertRule(lockedHTML, 0)
  return () => {
    document.head.removeChild(sheetNode)
    requestAnimationFrame(() => {
      node.scrollTo(scrollLeft, scrollTop)
    })
  }
}

/**
 * A component using this effect will block the scroll on document.html
 * while it is mounted. When unmounted, it restores the scroll.
 */

const useLockedBody = () => {
  useEffect(lockSaveAndRestoreScrollFx, [])
}

export default useLockedBody
