import React from 'react'

import JobsProvider from '../context/JobsContext'
import BanksProvider, { BanksContext } from '../context/BanksContext'
import { render, act } from '@testing-library/react'
import CozyClient, { useClient, Q } from 'cozy-client'

jest.mock('cozy-client')

export const createKonnectorMsg = (state, konnector, account) => ({
  worker: 'konnector',
  state,
  message: {
    konnector,
    account
  }
})

const RUNNING = 'running'
const KONNECTORS = [
  { konnector: 'caissedepargne1', account: '1234' },
  { konnector: 'boursorama83', account: '5678' },
  { konnector: 'alan', account: 'any' }
]

describe('Banks Context', () => {
  const setup = ({ konnectors }) => {
    const client = new CozyClient({})
    useClient.mockImplementation(() => client)
    Q.mockImplementation(() => ({
      where: jest.fn().mockImplementation(() => ({ indexFields: jest.fn() })),
      getByIds: jest.fn()
    }))
    client.fetchQueryAndGetFromState = jest.fn().mockResolvedValue({
      data: [
        { slug: 'caissedepargne1', name: 'Caisse Epargne' },
        { slug: 'boursorama83', name: 'Boursorama' }
      ]
    })
    client.queryAll.mockResolvedValue([
      { slug: 'caissedepargne1' },
      { slug: 'boursorama83' }
    ])

    client.plugins = {
      realtime: {
        subscribe: (eventName, doctype, handleRealtime) => {
          // There are 4 subscribers (created, updated, deleted, notified)
          // To simulate handle realtime we check if there are
          // at least the first event and we call handleRealtime callbacks
          if (eventName === 'created') {
            for (const konn of konnectors) {
              handleRealtime(
                createKonnectorMsg(RUNNING, konn.konnector, konn.account)
              )
            }
          }
        },
        unsubscribe: () => {}
      }
    }

    const children = (
      <BanksContext.Consumer>
        {({ jobsInProgress }) => {
          return jobsInProgress.map(job => (
            <div key={job.account}>
              <span>{job.konnector}</span>
              <span>{job.account}</span>
              <span>{job.institutionLabel}</span>
            </div>
          ))
        }}
      </BanksContext.Consumer>
    )

    const root = render(
      <JobsProvider client={client} options={{}}>
        <BanksProvider client={client}>{children}</BanksProvider>
      </JobsProvider>
    )

    return { root, client }
  }
  it('should display banks job in progress', async () => {
    const { root, client } = setup({ konnectors: KONNECTORS })
    await act(async () => expect(client.queryAll).toHaveBeenCalledTimes(1))
    expect(await root.findByText('caissedepargne1')).toBeTruthy()
    expect(await root.findByText('Caisse Epargne')).toBeTruthy()
    expect(await root.findByText('1234')).toBeTruthy()
    expect(await root.findByText('boursorama83')).toBeTruthy()
    expect(await root.findByText('5678')).toBeTruthy()
    expect(root.queryByText('alan')).toBeNull()
    expect(root.queryByText('any')).toBeNull()
  })

  it('should not display banks job in progress', async () => {
    const { root, client } = setup({ konnectors: [] })
    await act(async () => expect(client.queryAll).toHaveBeenCalledTimes(1))
    expect(root.queryByText('caissedepargne1')).toBeNull()
    expect(root.queryByText('1234')).toBeNull()
    expect(root.queryByText('boursorama83')).toBeNull()
    expect(root.queryByText('5678')).toBeNull()
    expect(root.queryByText('alan')).toBeNull()
    expect(root.queryByText('any')).toBeNull()
  })
})
