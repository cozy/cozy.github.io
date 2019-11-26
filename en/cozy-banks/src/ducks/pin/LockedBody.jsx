import React from 'react'

const saveScroll = node => {
  let scrollLeft = node.scrollLeft
  let scrollTop = node.scrollTop
  return () => {
    node.scrollTo(scrollLeft, scrollTop)
  }
}

/**
 * While this component is mounted, it blocks the scroll on document.body
 * When unmounted, it restores the scroll
 */
class LockedBody extends React.Component {
  componentDidMount() {
    this.restoreScroll = saveScroll(document.body)

    const sheetNode = document.createElement('style')
    document.head.appendChild(sheetNode)
    sheetNode.sheet.insertRule(
      `html, body { position: fixed; overflow: hidden !important; }`,
      0
    )
    this.sheetNode = sheetNode
  }

  componentWillUnmount() {
    document.head.removeChild(this.sheetNode)
    this.restoreScroll()
  }

  render() {
    return this.props.children
  }
}

export default LockedBody
