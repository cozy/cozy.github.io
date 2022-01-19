const createGenerator = require('./random')

describe('Random number generator', () => {
  it('should create different sequence of numbers', async () => {
    let generator1 = createGenerator('seed1')

    let arr1 = Array(5)
      .fill(0)
      .map(() => generator1())
    let arr2 = Array(5)
      .fill(0)
      .map(() => generator1())
    expect(arr1).not.toEqual(arr2)
  })

  it('should create the same numbers with the same seeds', async () => {
    let generator1 = createGenerator('seed1')
    let generator2 = createGenerator('seed1')

    let arr1 = Array(5)
      .fill(0)
      .map(() => generator1())
    let arr2 = Array(5)
      .fill(0)
      .map(() => generator2())
    expect(arr1).toEqual(arr2)
  })

  it('should create different numbers with the different seeds', async () => {
    let generator1 = createGenerator('seed1')
    let generator2 = createGenerator('seed2')

    let arr1 = Array(5)
      .fill(0)
      .map(() => generator1())
    let arr2 = Array(5)
      .fill(0)
      .map(() => generator2())
    expect(arr1).not.toEqual(arr2)
  })
})
