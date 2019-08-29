import { mergeStyles } from './styleUtils'

describe('style utils', () => {
  it('should correctly compute styles', () => {
    const base = { border: 1, color: 'back' }
    const styleObj = mergeStyles(
      {
        container: base => ({
          ...base,
          background: 'blue'
        })
      },
      {
        container: () => ({
          background: 'red',
          color: 'yellow'
        })
      }
    )
    expect(styleObj.container(base)).toMatchObject({
      background: 'red',
      color: 'yellow',
      border: 1
    })
  })
})
