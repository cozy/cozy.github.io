import React from 'react'
import { useDispatch } from 'react-redux'
import { createMockClient } from 'cozy-client/dist/mock'
import { render } from '@testing-library/react'

import AppLike from 'test/AppLike'
import { useParams, useRouter } from 'components/RouterContext'
import SetFilterAndRedirect from './SetFilterAndRedirect'

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn()
}))

jest.mock('components/RouterContext', () => ({
  __esModule: true,
  ...jest.requireActual('components/RouterContext'),
  useParams: jest.fn(),
  useRouter: jest.fn()
}))

beforeEach(() => {
  useDispatch.mockReset()
  useParams.mockReset()
  useRouter.mockReset()
})

describe('SetFilterAndRedirect', () => {
  const setup = ({ params }) => {
    const router = { push: jest.fn() }
    const dispatch = jest.fn()
    useDispatch.mockReturnValue(dispatch)
    useRouter.mockReturnValue(router)
    useParams.mockReturnValue(params)
    const client = createMockClient({
      queries: {
        accounts: {
          doctype: 'io.cozy.bank.accounts',
          data: [{ _id: 'account-1' }]
        },
        groups: {
          doctype: 'io.cozy.bank.groups',
          data: [{ _id: 'group-1' }]
        }
      }
    })
    const root = render(
      <AppLike client={client}>
        <SetFilterAndRedirect />
      </AppLike>
    )
    return { root, router, dispatch }
  }

  it('should redirect to an existing account and set the filter', () => {
    const { router, dispatch } = setup({
      params: {
        accountOrGroupId: 'account-1',
        page: 'details'
      }
    })
    expect(router.push).toHaveBeenCalledWith(`/balances/details`)
    expect(dispatch).toHaveBeenCalledWith({
      doc: {
        _id: 'account-1',
        _type: 'io.cozy.bank.accounts'
      },
      type: 'FILTER_BY_DOC'
    })
  })

  it('should redirect to an existing group and set the filter', () => {
    const { router, dispatch } = setup({
      params: {
        accountOrGroupId: 'group-1',
        page: 'details'
      }
    })
    expect(router.push).toHaveBeenCalledWith(`/balances/details`)
    expect(dispatch).toHaveBeenCalledWith({
      doc: {
        _id: 'group-1',
        _type: 'io.cozy.bank.groups'
      },
      type: 'FILTER_BY_DOC'
    })
  })

  it('should redirect to balances if account/group does not exist', () => {
    const { router, dispatch } = setup({
      params: {
        accountOrGroupId: 'unexisting-group-id',
        page: 'details'
      }
    })
    expect(router.push).toHaveBeenCalledWith(`/balances`)
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('should wait until accounts and groups have been loaded', () => {
    const router = { push: jest.fn() }
    const dispatch = jest.fn()
    useDispatch.mockReturnValue(dispatch)
    useRouter.mockReturnValue(router)
    useParams.mockReturnValue({
      accountOrGroupId: 'group-1',
      page: 'details'
    })
    const client = createMockClient({
      queries: {
        groups: {
          doctype: 'io.cozy.bank.groups',
          data: [{ _id: 'group-1' }]
        }
      }
    })
    render(
      <AppLike client={client}>
        <SetFilterAndRedirect />
      </AppLike>
    )
    expect(router.push).not.toHaveBeenCalled()
  })
})
