import { createMockClient } from 'cozy-client/dist/mock'

import { JOBS_DOCTYPE } from 'doctypes'

import { launchExportJob, isExportJobInProgress } from './helpers'

describe('Export Job', () => {
  const makeJob = ({ name, slug, state }) => {
    return {
      type: 'io.cozy.jobs',
      attributes: {
        worker: 'service',
        message: {
          name,
          slug
        },
        state
      }
    }
  }

  const setup = ({
    jobs = [],
    mockCreate = jest.fn(),
    mockDownload = jest.fn()
  } = {}) => {
    const client = createMockClient({
      remote: {
        [JOBS_DOCTYPE]: jobs
      }
    })

    client.collection = jest.fn(() => ({
      create: mockCreate,
      download: mockDownload
    }))

    return client
  }

  describe('launchExportJob', () => {
    it('should not create a new job if it already exists', async () => {
      const jobs = [makeJob({ name: 'export', slug: 'banks', state: 'queued' })]
      const mockCreate = jest.fn()
      const client = setup({ jobs, mockCreate })

      await launchExportJob(client)

      expect(mockCreate).toBeCalledTimes(0)
    })

    it("should create a new job if it doesn't already exist with the correct arguments", async () => {
      const mockCreate = jest.fn()
      const client = setup({ jobs: [], mockCreate })

      await launchExportJob(client)

      expect(mockCreate).toBeCalledTimes(1)
      expect(mockCreate).toBeCalledWith(
        'service',
        { slug: 'banks', name: 'export' },
        {},
        true
      )
    })
  })

  describe('isExportJobInProgress', () => {
    it('should return "false" if export job is not running or queued', async () => {
      const client = setup({ jobs: [] })

      const res = await isExportJobInProgress(client)

      expect(res).toBe(false)
    })

    it('should return "true" if export job is running or queued', async () => {
      const jobs = [makeJob({ name: 'export', slug: 'banks', state: 'queued' })]
      const client = setup({ jobs })

      const res = await isExportJobInProgress(client)

      expect(res).toBe(true)
    })
  })
})
