import React from 'react'

import JobsProvider, { JobsContext } from '../context/JobsContext'
import { render } from '@testing-library/react'
import { createMockClient } from 'cozy-client'

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
  { konnector: 'boursorama83', account: '5678' }
]

describe('Jobs Context', () => {
  const setup = ({ konnectors }) => {
    const client = new createMockClient({})
    client.plugins.realtime = {
      subscribe: (eventName, doctype, handleRealtime) => {
        // There are 3 subscribers (created, updated, deleted)
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

    const children = (
      <JobsContext.Consumer>
        {({ jobsInProgress }) => {
          return jobsInProgress.map(job => (
            <div key={job.account}>
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
  it('should display job in progress', async () => {
    const root = setup({ konnectors: [KONNECTORS[0], KONNECTORS[1]] })
    expect(await root.findByText('caissedepargne1')).toBeTruthy()
    expect(await root.findByText('1234')).toBeTruthy()
    expect(await root.findByText('boursorama83')).toBeTruthy()
    expect(await root.findByText('5678')).toBeTruthy()
  })

  it('should not display job in progress', () => {
    const root = setup({ konnectors: [] })
    expect(root.queryByText('caissedepargne1')).toBeNull()
    expect(root.queryByText('1234')).toBeNull()
    expect(root.queryByText('boursorama83')).toBeNull()
    expect(root.queryByText('5678')).toBeNull()
  })
})
