import TopMost from './TopMost'

const makeNodeAtTop = top => ({
  getBoundingClientRect: () => ({ top })
})

describe('TopMost', () => {
  it('should compute the highest visible node', () => {
    const fakeEl = makeNodeAtTop(300)
    const getScrollingElement = () => fakeEl
    const tm = new TopMost(getScrollingElement)
    tm.addNode('a', makeNodeAtTop(100))
    tm.addNode('b', makeNodeAtTop(200))
    tm.addNode('c', makeNodeAtTop(300))
    tm.addNode('d', makeNodeAtTop(400))
    tm.addNode('e', makeNodeAtTop(500))
    expect(tm.getTopMostVisibleNodeId()).toBe('c')
  })
})
