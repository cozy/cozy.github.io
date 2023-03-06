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
    mockQueued = jest.fn(),
    mockCreate = jest.fn(),
    mockDownload = jest.fn()
  } = {}) => {
    const client = {
      collection: jest.fn(() => ({
        queued: mockQueued,
        create: mockCreate,
        download: mockDownload
      }))
    }
    return client
  }

  describe('launchExportJob', () => {
    it('should not create a new job if it already exists', async () => {
      const expected = [
        makeJob({ name: 'export', slug: 'banks' }),
        makeJob({ name: 'otherName', slug: 'otherSlug' })
      ]
      const mockQueued = jest.fn(() => ({ data: expected }))
      const mockCreate = jest.fn(() => ({ data: expected }))
      const client = setup({ mockQueued, mockCreate })

      await launchExportJob(client)

      expect(mockCreate).toBeCalledTimes(0)
    })

    it("should create a new job if it doesn't already exist with the correct arguments", async () => {
      const expected = [
        makeJob({ name: 'na', slug: 'na' }),
        makeJob({ name: 'otherName', slug: 'otherSlug' })
      ]
      const mockQueued = jest.fn(() => ({ data: expected }))
      const mockCreate = jest.fn(() => ({ data: expected }))
      const client = setup({ mockQueued, mockCreate })

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
      const expected = [
        makeJob({ name: 'na', slug: 'na' }),
        makeJob({ name: 'otherName', slug: 'otherSlug' })
      ]
      const mockQueued = jest.fn(() => ({ data: expected }))
      const client = setup({ mockQueued })

      const res = await isExportJobInProgress(client)

      expect(res).toBe(false)
    })

    it('should return "true" if export job is running or queued', async () => {
      const expected = [
        makeJob({ name: 'export', slug: 'banks' }),
        makeJob({ name: 'otherName', slug: 'otherSlug' })
      ]
      const mockQueued = jest.fn(() => ({ data: expected }))
      const client = setup({ mockQueued })

      const res = await isExportJobInProgress(client)

      expect(res).toBe(true)
    })
  })
})
