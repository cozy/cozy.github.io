import React from 'react'

import JobsProvider, { JobsContext } from '../context/JobsContext'
import { render, act } from '@testing-library/react'
import CozyClient from 'cozy-client'

export const createKonnectorMsg = (
  state,
  konnector,
  account,
  event,
  bi_webhook
) => ({
  worker: 'konnector',
  state,
  message: {
    konnector,
    account,
    bi_webhook,
    event
  }
})

const RUNNING = 'running'
const KONNECTORS = [
  { konnector: 'caissedepargne1', account: '1234' },
  { konnector: 'boursorama83', account: '5678' },
  {
    konnector: 'caissedepargne1',
    account: '1234',
    bi_webhook: true,
    event: 'CONNECTION_SYNCED'
  },
  {
    konnector: 'caissedepargne1',
    account: '1234',
    bi_webhook: true,
    event: 'CONNECTION_DELETED'
  }
]

describe('Jobs Context', () => {
  const setup = ({ konnectors, waitKonnectors = [] }) => {
    const client = new CozyClient({})
    client.plugins.realtime = {
      subscribe: (eventName, doctype, handleRealtime) => {
        // There are 4 subscribers (created, updated, deleted, notified)
        // To simulate handle realtime we check if there are
        // at least the first event and we call handleRealtime callbacks
        if (eventName === 'created') {
          for (const konn of konnectors) {
            setTimeout(
              () =>
                handleRealtime(
                  createKonnectorMsg(
                    RUNNING,
                    konn.konnector,
                    konn.account,
                    konn.event,
                    konn.bi_webhook
                  )
                ),
              konn.timeout || 1
            )
          }
        } else if (eventName === 'notified') {
          for (const konn of waitKonnectors) {
            setTimeout(
              () => handleRealtime({ data: { slug: konn.slug } }),
              konn.timeout || 1
            )
          }
        }
      },
      unsubscribe: () => {}
    }

    const children = (
      <JobsContext.Consumer>
        {({ jobsInProgress }) => {
          return jobsInProgress.map(job => (
            <div key={job.konnector}>
              <span>{job.konnector}</span>
              <span>{job.account}</span>
            </div>
          ))
        }}
      </JobsContext.Consumer>
    )
    const root = render(
      <JobsProvider client={client} options={{}}>
        {children}
      </JobsProvider>
    )
    return root
  }

  afterEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })
  it('should display job in progress', async () => {
    const root = setup({ konnectors: [KONNECTORS[0], KONNECTORS[1]] })
    expect(await root.findByText('caissedepargne1')).toBeTruthy()
    expect(await root.findByText('1234')).toBeTruthy()
    expect(await root.findByText('boursorama83')).toBeTruthy()
    expect(await root.findByText('5678')).toBeTruthy()
  })

  it('should not display job in progress for a CONNECTION_DELETED job', () => {
    const root = setup({ konnectors: [KONNECTORS[3]] })
    expect(root.queryByText('caissedepargne1')).toBeNull()
    expect(root.queryByText('1234')).toBeNull()
    expect(root.queryByText('boursorama83')).toBeNull()
    expect(root.queryByText('5678')).toBeNull()
  })

  it('should display wait job in progress', async () => {
    const root = setup({
      konnectors: [],
      waitKonnectors: [{ slug: 'caissedepargne1' }]
    })
    expect(await root.findByText('caissedepargne1')).toBeTruthy()
    expect(root.queryByText('boursorama83')).toBeNull()
  })
  it('should still display job in progress when real job is running', async () => {
    const root = setup({
      konnectors: [KONNECTORS[2]],
      waitKonnectors: [{ slug: 'caissedepargne1', timeout: 10 }]
    })
    expect(await root.findByText('caissedepargne1')).toBeTruthy()
    expect(await root.findByText('1234')).toBeTruthy()
    expect(root.queryByText('boursorama83')).toBeNull()
    expect(root.queryByText('5678')).toBeNull()
  })
  it('should should hide wait job in progress after around 5 minutes if no real job was created', async () => {
    const root = setup({
      konnectors: [],
      waitKonnectors: [{ slug: 'boursorama83' }]
    })
    expect(await root.findByText('boursorama83')).toBeTruthy()

    jest.spyOn(Date, 'now').mockImplementation(() => 0)
    jest.useFakeTimers()

    Date.now.mockImplementation(() => 6 * 1000 * 60)
    act(() => {
      jest.advanceTimersByTime(6 * 1000 * 60)
    })
    root.rerender()

    expect(root.queryByText('boursorama83')).toBeNull()
  })
})
