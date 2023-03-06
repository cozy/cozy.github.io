import React from 'react'
import { fireEvent, render, waitForElement } from '@testing-library/react'

import { useQuery } from 'cozy-client'

import AppLike from 'test/AppLike'
import Export from 'ducks/settings/Export'
import { downloadFile } from 'ducks/settings/helpers'
import { isExportJobInProgress } from 'ducks/export/helpers'

jest.mock('cozy-client/dist/hooks/useQuery', () => jest.fn())
jest.mock('ducks/export/helpers', () => ({
  ...jest.requireActual('ducks/export/helpers'),
  isExportJobInProgress: jest.fn()
}))
jest.mock('ducks/settings/helpers', () => ({
  ...jest.requireActual('ducks/settings/helpers'),
  downloadFile: jest.fn()
}))

const setup = ({
  queryDataResult = [],
  mockDownloadFile = jest.fn(),
  mockIsExportJobInProgress = jest.fn()
} = {}) => {
  useQuery.mockReturnValue({
    data: queryDataResult
  })
  downloadFile.mockImplementation(mockDownloadFile)
  isExportJobInProgress.mockImplementation(mockIsExportJobInProgress)

  return render(
    <AppLike>
      <Export />
    </AppLike>
  )
}

describe('Export', () => {
  describe('Download button', () => {
    it('should have active download button if has no export job in progress and export file exists', async () => {
      const mockIsExportJobInProgress = jest.fn().mockResolvedValueOnce(false)
      const { getByTestId } = setup({
        queryDataResult: [
          { name: 'export-data-banks.csv', dir_id: 'io.cozy.files.root-dir' }
        ],
        mockIsExportJobInProgress
      })
      const downloadBtn = await waitForElement(() =>
        getByTestId('download-btn')
      )

      expect(downloadBtn).toHaveProperty('disabled', false)
    })

    it('should have deactive download button if has no export job in progress and no export file exists', async () => {
      const mockIsExportJobInProgress = jest.fn().mockResolvedValueOnce(false)
      const { getByTestId } = setup({
        queryDataResult: [],
        mockIsExportJobInProgress
      })
      const downloadBtn = await waitForElement(() =>
        getByTestId('download-btn')
      )

      expect(downloadBtn).toHaveProperty('disabled', true)
    })

    it('should have deactive download button if has export job in progress and export file exists', async () => {
      const mockIsExportJobInProgress = jest.fn().mockResolvedValueOnce(true)
      const { getByTestId } = setup({
        queryDataResult: [
          { name: 'export-data-banks.csv', dir_id: 'io.cozy.files.root-dir' }
        ],
        mockIsExportJobInProgress
      })
      const downloadBtn = await waitForElement(() =>
        getByTestId('download-btn')
      )

      expect(downloadBtn).toHaveProperty('disabled', true)
    })

    it('should have deactive download button if has export job in progress and no export file exists', async () => {
      const mockIsExportJobInProgress = jest.fn().mockResolvedValueOnce(true)
      const { getByTestId } = setup({
        queryDataResult: [],
        mockIsExportJobInProgress
      })
      const downloadBtn = await waitForElement(() =>
        getByTestId('download-btn')
      )

      expect(downloadBtn).toHaveProperty('disabled', true)
    })

    it('should not call "downloadFile" when click on deactive button', async () => {
      const mockIsExportJobInProgress = jest.fn().mockResolvedValueOnce(true)
      const mockDownloadFile = jest.fn()
      const { getByTestId } = setup({
        queryDataResult: [
          { name: 'export-data-banks.csv', dir_id: 'io.cozy.files.root-dir' }
        ],
        mockIsExportJobInProgress,
        mockDownloadFile
      })
      const downloadBtn = await waitForElement(() =>
        getByTestId('download-btn')
      )

      fireEvent.click(downloadBtn)

      expect(mockDownloadFile).toBeCalledTimes(0)
    })

    it('should call "downloadFile" when click on active button', async () => {
      const mockIsExportJobInProgress = jest.fn().mockResolvedValueOnce(false)
      const mockDownloadFile = jest.fn()
      const { getByTestId } = setup({
        queryDataResult: [
          { name: 'export-data-banks.csv', dir_id: 'io.cozy.files.root-dir' }
        ],
        mockIsExportJobInProgress,
        mockDownloadFile
      })
      const downloadBtn = await waitForElement(() =>
        getByTestId('download-btn')
      )

      fireEvent.click(downloadBtn)

      expect(mockDownloadFile).toBeCalledTimes(1)
    })
  })
})
