import React from 'react'
import { fireEvent, render, waitForElement } from '@testing-library/react'
import '@testing-library/jest-dom'
import MicroEE from 'microee'

import AppLike from 'test/AppLike'
import Import from 'ducks/settings/Import/Import'
import {
  uploadImportFile,
  launchImportJob
} from 'ducks/settings/Import/helpers'

function PromiseEmitter() {}
MicroEE.mixin(PromiseEmitter)
const mockPromiseEmitter = new PromiseEmitter()

jest.mock('ducks/settings/Import/helpers', () => ({
  ...jest.requireActual('ducks/settings/Import/helpers'),
  uploadImportFile: jest.fn(),
  launchImportJob: jest.fn()
}))

const setup = () => {
  return render(
    <AppLike>
      <Import />
    </AppLike>
  )
}

describe('Import', () => {
  const selectMockFile = fileInputImport => {
    fireEvent.change(fileInputImport, {
      target: {
        files: [new File(['my data'], 'import.csv', { type: 'text/csv' })]
      }
    })
  }

  describe('Import action', () => {
    it('should have a the import button disabled if a file is not selected', () => {
      const { getByTestId } = setup()
      const importBtn = getByTestId('ImportButton')

      expect(importBtn).toHaveProperty('disabled', true)
    })

    it('should have the import button enabled if a file is selected', () => {
      const { getByTestId } = setup()
      const fileInputImport = getByTestId('FileInputImport')
      selectMockFile(fileInputImport)

      const ImportButton = getByTestId('ImportButton')

      expect(ImportButton).toHaveProperty('disabled', false)
    })

    it('should have the import button disabled if a file is selected and uploading is in progress', async () => {
      const uploadImportFilePromise = new Promise(resolve => {
        mockPromiseEmitter.on('uploadImportFile', file =>
          resolve({ data: file })
        )
      })
      uploadImportFile.mockReturnValue(uploadImportFilePromise)

      const { getByTestId } = setup()
      const fileInputImport = getByTestId('FileInputImport')
      selectMockFile(fileInputImport)

      let ImportButton = getByTestId('ImportButton')
      expect(ImportButton).toHaveProperty('disabled', false)

      fireEvent.click(ImportButton)

      ImportButton = await waitForElement(() => getByTestId('ImportButton'))
      expect(ImportButton).toHaveProperty('disabled', true)
    })

    it('should have the import button disabled if a file is selected and the service import is in progress', async () => {
      const fakeProcessingPromise = new Promise(resolve => {
        mockPromiseEmitter.on('fakeProcessing', () => resolve())
      })
      uploadImportFile.mockResolvedValue({ data: { _id: 'fileId' } })
      launchImportJob.mockReturnValue(fakeProcessingPromise)

      const { getByTestId } = setup()
      const fileInputImport = getByTestId('FileInputImport')
      selectMockFile(fileInputImport)

      let ImportButton = getByTestId('ImportButton')
      expect(ImportButton).toHaveProperty('disabled', false)

      fireEvent.click(ImportButton)

      ImportButton = await waitForElement(() => getByTestId('ImportButton'))
      expect(ImportButton).toHaveProperty('disabled', true)
    })

    it('should have the import button enabled if uploading & service are successed', async () => {
      uploadImportFile.mockResolvedValue({ data: { _id: 'fileId' } })
      launchImportJob.mockResolvedValue()

      const { getByTestId } = setup()
      const fileInputImport = getByTestId('FileInputImport')
      selectMockFile(fileInputImport)

      let ImportButton = getByTestId('ImportButton')
      expect(ImportButton).toHaveProperty('disabled', false)

      fireEvent.click(ImportButton)

      ImportButton = await waitForElement(() => getByTestId('ImportButton'))
      expect(ImportButton).toHaveProperty('disabled', false)
    })
  })
})
