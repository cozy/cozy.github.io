/**
 * This component should be in cozy-ui
 * See https://github.com/cozy/cozy-ui/pull/1258
 * It is here temporarily, waiting for the PR to be merged
 */

import React, { useState } from 'react'
import Modal from 'cozy-ui/react/Modal'
import { ViewStackContext } from 'cozy-ui/react'

const sleep = duration => new Promise(resolve => setTimeout(resolve, duration))

// Same as in cozy-ui
const useStack = (initialState, options = {}) => {
  const [arr, setArray] = useState(initialState)
  const [curIndex, setCurIndex] = useState(initialState.length - 1)

  const push = (item, itemOptions) => {
    const newArr = [...arr, itemOptions ? [item, itemOptions] : item]
    setArray(newArr)
    setCurIndex(curIndex + 1)
  }

  const pop = async () => {
    if (arr.length <= 1) {
      return
    }
    const newArr = arr.slice(0, -1)
    setCurIndex(curIndex - 1)
    if (options.popDelay) {
      await sleep(options.popDelay)
    }
    setArray(newArr)
  }

  return [arr, curIndex, push, pop]
}

/**
 * Wraps children on the stack with a modal. When pushing on the stack,
 * children can take options.
 */
const ModalStack = ({ children }) => {
  const [stChildren, , stackPush, stackPop] = useStack(
    React.Children.toArray(children)
  )

  const contextValue = { stackPush, stackPop }

  return (
    <ViewStackContext.Provider value={contextValue}>
      {stChildren[0]}
      {stChildren.slice(1).map((child, i) => {
        const hasProps = child.length > 1
        const props = hasProps ? child[1] : null
        child = hasProps ? child[0] : child
        return (
          <Modal mobileFullscreen key={i} dismissAction={stackPop} {...props}>
            {child}
          </Modal>
        )
      })}
    </ViewStackContext.Provider>
  )
}

export default ModalStack
