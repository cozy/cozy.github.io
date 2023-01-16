import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { createMockClient } from 'cozy-client/dist/mock'
import { render } from '@testing-library/react'

import AppLike from 'test/AppLike'
import SetFilterAndRedirect from './SetFilterAndRedirect'

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn()
}))

jest.mock('react-router-dom', () => ({
  __esModule: true,
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn()
}))

beforeEach(() => {
  useDispatch.mockReset()
  useParams.mockReset()
  useNavigate.mockReset()
})

describe('SetFilterAndRedirect', () => {
  const setup = ({ params }) => {
    const dispatch = jest.fn()
    const navigate = jest.fn()
    useDispatch.mockReturnValue(dispatch)
    useNavigate.mockReturnValue(navigate)
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
    return { root, navigate, dispatch }
  }

  it('should redirect to an existing account and set the filter', () => {
    const { navigate, dispatch } = setup({
      params: {
        accountOrGroupId: 'account-1',
        page: 'details'
      }
    })
    expect(navigate).toHaveBeenCalledWith(`/balances/details`)
    expect(dispatch).toHaveBeenCalledWith({
      doc: {
        _id: 'account-1',
        _type: 'io.cozy.bank.accounts'
      },
      type: 'FILTER_BY_DOC'
    })
  })

  it('should redirect to an existing group and set the filter', () => {
    const { navigate, dispatch } = setup({
      params: {
        accountOrGroupId: 'group-1',
        page: 'details'
      }
    })
    expect(navigate).toHaveBeenCalledWith(`/balances/details`)
    expect(dispatch).toHaveBeenCalledWith({
      doc: {
        _id: 'group-1',
        _type: 'io.cozy.bank.groups'
      },
      type: 'FILTER_BY_DOC'
    })
  })

  it('should redirect to balances if account/group does not exist', () => {
    const { navigate, dispatch } = setup({
      params: {
        accountOrGroupId: 'unexisting-group-id',
        page: 'details'
      }
    })
    expect(navigate).toHaveBeenCalledWith(`/balances`)
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('should wait until accounts and groups have been loaded', () => {
    const dispatch = jest.fn()
    const navigate = jest.fn()
    useDispatch.mockReturnValue(dispatch)
    useNavigate.mockReturnValue(navigate)
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
    expect(navigate).not.toHaveBeenCalled()
  })
})
