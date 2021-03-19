import React from 'react'

import JobsProvider, { JobsContext } from '../context/JobsContext'
import { render } from '@testing-library/react'
import CozyClient from 'cozy-client'
import CozyRealtime from 'cozy-realtime'

jest.mock('cozy-realtime')

export const createKonnectorMsg = (state, konnector, account) => ({
  worker: 'konnector',
  state,
  message: {
    konnector,
    account
  }
})

const RUNNING = 'running'

describe('Jobs Context', () => {
  it('should display job in progress', async () => {
    const client = new CozyClient({})
    CozyRealtime.mockImplementation(() => {
      return {
        subscribe: (eventName, doctype, handleRealtime) => {
          // There are 3 subscribers (created, updated, deleted)
          // To simulate handle realtime we check if there are
          // at least the first event and we call handleRealtime callbacks
          if (eventName === 'created') {
            handleRealtime(
              createKonnectorMsg(RUNNING, 'caissedepargne1', '1234')
            )
            handleRealtime(createKonnectorMsg(RUNNING, 'boursorama83', '5678'))
          }
        },
        unsubscribe: () => {}
      }
    })

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
    expect(await root.findByText('caissedepargne1')).toBeTruthy()
    expect(await root.findByText('1234')).toBeTruthy()
    expect(await root.findByText('boursorama83')).toBeTruthy()
    expect(await root.findByText('5678')).toBeTruthy()
  })
})
