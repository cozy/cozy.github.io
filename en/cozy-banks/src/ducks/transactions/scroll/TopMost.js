import sortBy from 'lodash/sortBy'
import find from 'lodash/find'

/**
 * TopMost stores DOM nodes and computes the top most
 * visible node.
 */
class TopMost {
  constructor(getScrollingElement) {
    this.getScrollingElement = getScrollingElement
    this.nodes = {}
  }

  addNode(id, node) {
    this.nodes[id] = node
  }

  getTopMostVisibleNodeId() {
    const scrollEl = this.getScrollingElement()
    const topRoot =
      scrollEl === window ? 0 : scrollEl.getBoundingClientRect().top
    const offsets = sortBy(
      Object.entries(this.nodes).map(([tId, node]) => {
        const rect = node ? node.getBoundingClientRect() : null
        return [tId, rect ? rect.top : Infinity]
      }),
      x => x[1]
    )
    const topMost = find(offsets, o => {
      const offset = o[1]
      return offset - topRoot >= 0
    })
    return topMost ? topMost[0] : null
  }
}

export default TopMost
