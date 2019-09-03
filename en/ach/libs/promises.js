/**
 * Different strategies on how to create promises
 */

const PromisePool = require('es6-promise-pool')

/**
 * Applies function and returns the argument passed,
 * useful to do stuff without changing the result in
 * a promise chain
 */
const tee = (module.exports.tee = fn => arg => {
  fn(arg)
  return arg
})

module.exports.runSerially = function(arr, createPromise) {
  let prom
  const results = []
  const pushToResults = tee(result => results.push(result))
  const createAndPush = item => createPromise(item).then(pushToResults)
  for (let i in arr) {
    let item = arr[i]
    prom = !prom ? createAndPush(item) : prom.then(() => createAndPush(item))
  }
  return prom.then(() => results)
}

const runInPool = (module.exports.runInPool = concurrency => (
  arr,
  createPromise
) => {
  let i = 0
  const results = []
  const pushToResults = tee(res => results.push(res))

  const producer = () => {
    const item = arr[i++]
    return !item ? null : createPromise(item).then(pushToResults)
  }

  const pool = new PromisePool(producer, concurrency)
  return pool.start().then(() => results)
})

const pushAll = function(arr, otherArr) {
  return arr.push.apply(arr, otherArr)
}

const runStrategyAfterFirst = strategy => {
  return function(arr, createPromise) {
    const results = []
    const pushAllToResults = tee(res => pushAll(results, res))
    const rest = arr.slice(1)
    return createPromise(arr[0])
      .then(res => {
        results.push(res)
        return strategy(rest, createPromise).then(pushAllToResults)
      })
      .then(() => results)
  }
}

module.exports.runInPoolAfterFirst = concurrency =>
  runStrategyAfterFirst(runInPool(concurrency))
