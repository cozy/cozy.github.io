import React from 'react'
import { renderHook } from '@testing-library/react-hooks'
import { CozyProvider, Q } from 'cozy-client'
import { createMockClient } from 'cozy-client/dist/mock'
import useFullyLoadedQuery from './useFullyLoadedQuery'

const sleep = delay => new Promise(resolve => setTimeout(resolve, delay))

describe('useFullyLoadedQuery', () => {
  const setup = ({ todosResult }) => {
    const client = createMockClient({
      queries: {
        todos: todosResult
      }
    })
    client.query.mockImplementation(async () => {
      // give a little time for hook to be re-rendered several times
      await sleep(10)
      return {
        data: [{ _id: '2', done: false }],
        next: false
      }
    })
    const wrapper = ({ children }) => (
      <CozyProvider client={client}>{children}</CozyProvider>
    )
    const query = Q('io.cozy.todos')
    const options = {
      as: 'todos'
    }
    const hook = renderHook(() => useFullyLoadedQuery(query, options), {
      wrapper
    })
    return { client, wrapper, hook }
  }

  it('should run only 1 fetch more even if the hook is rendered-multiple times', () => {
    const {
      client,
      hook: { result, rerender }
    } = setup({
      todosResult: {
        data: [{ _id: '1', done: true }],
        next: true,
        doctype: 'io.cozy.todos'
      }
    })
    expect(result.error).toBeFalsy()
    rerender()
    rerender()
    rerender()
    rerender()

    // one for the initial query and one for the fetchMore
    expect(client.query).toHaveBeenCalledTimes(2)
  })

  it('should not run fetch if there are no more results', () => {
    const {
      client,
      hook: { result, rerender }
    } = setup({
      todosResult: {
        data: [{ _id: '1', done: true }],
        next: false,
        doctype: 'io.cozy.todos'
      }
    })
    expect(result.error).toBeFalsy()
    rerender()
    rerender()
    rerender()
    rerender()

    // one for the initial query and one for the fetchMore
    expect(client.query).toHaveBeenCalledTimes(1)
  })
})
