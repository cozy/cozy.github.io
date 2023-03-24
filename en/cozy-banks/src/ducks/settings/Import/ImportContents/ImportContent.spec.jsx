import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'

import AppLike from 'test/AppLike'
import ImportContent from 'ducks/settings/Import/ImportContents/ImportContent'

const setup = ({
  file = null,
  setFile = jest.fn(),
  isBusy = false,
  isSuccess = false,
  isServiceInProgress = false
} = {}) => {
  return render(
    <AppLike>
      <ImportContent
        file={file}
        setFile={setFile}
        isBusy={isBusy}
        isSuccess={isSuccess}
        isServiceInProgress={isServiceInProgress}
      />
    </AppLike>
  )
}

describe('ImportContent', () => {
  const mockCSVFile = new File(['my data'], 'import.csv', { type: 'text/csv' })

  it('should return ImportContentWithoutFile component if a file is not selected', () => {
    const { getByTestId, queryByTestId } = setup()

    const ImportContentWithoutFile = getByTestId('ImportContentWithoutFile')
    const ImportContentWithFile = queryByTestId('ImportContentWithFile')
    const ImportContentBusy = queryByTestId('ImportContentBusy')
    const ImportContentServiceInProgress = queryByTestId(
      'ImportContentServiceInProgress'
    )
    const ImportContentSuccess = queryByTestId('ImportContentSuccess')

    expect(ImportContentWithoutFile).toBeInTheDocument()
    expect(ImportContentWithFile).toBeNull()
    expect(ImportContentBusy).toBeNull()
    expect(ImportContentServiceInProgress).toBeNull()
    expect(ImportContentSuccess).toBeNull()
  })

  it('should return ImportContentWithFile component if a file is selected', () => {
    const { getByTestId, queryByTestId } = setup({ file: mockCSVFile })

    const ImportContentWithFile = getByTestId('ImportContentWithFile')
    const ImportContentWithoutFile = queryByTestId('ImportContentWithoutFile')
    const ImportContentBusy = queryByTestId('ImportContentBusy')
    const ImportContentServiceInProgress = queryByTestId(
      'ImportContentServiceInProgress'
    )
    const ImportContentSuccess = queryByTestId('ImportContentSuccess')

    expect(ImportContentWithFile).toBeInTheDocument()
    expect(ImportContentWithoutFile).toBeNull()
    expect(ImportContentBusy).toBeNull()
    expect(ImportContentServiceInProgress).toBeNull()
    expect(ImportContentSuccess).toBeNull()
  })

  it('should return the ImportContentBusy component if a status is busy', () => {
    const { getByTestId, queryByTestId } = setup({
      file: mockCSVFile,
      isBusy: true
    })

    const ImportContentBusy = getByTestId('ImportContentBusy')
    const ImportContentWithFile = queryByTestId('ImportContentWithFile')
    const ImportContentWithoutFile = queryByTestId('ImportContentWithoutFile')
    const ImportContentServiceInProgress = queryByTestId(
      'ImportContentServiceInProgress'
    )
    const ImportContentSuccess = queryByTestId('ImportContentSuccess')

    expect(ImportContentBusy).toBeInTheDocument()
    expect(ImportContentWithoutFile).toBeNull()
    expect(ImportContentWithFile).toBeNull()
    expect(ImportContentServiceInProgress).toBeNull()
    expect(ImportContentSuccess).toBeNull()
  })

  it('should return the ImportContentServiceInProgress component if status is service in progress', () => {
    const { getByTestId, queryByTestId } = setup({
      file: mockCSVFile,
      isServiceInProgress: true
    })

    const ImportContentServiceInProgress = getByTestId(
      'ImportContentServiceInProgress'
    )
    const ImportContentBusy = queryByTestId('ImportContentBusy')
    const ImportContentWithFile = queryByTestId('ImportContentWithFile')
    const ImportContentWithoutFile = queryByTestId('ImportContentWithoutFile')
    const ImportContentSuccess = queryByTestId('ImportContentSuccess')

    expect(ImportContentServiceInProgress).toBeInTheDocument()
    expect(ImportContentWithoutFile).toBeNull()
    expect(ImportContentWithFile).toBeNull()
    expect(ImportContentBusy).toBeNull()
    expect(ImportContentSuccess).toBeNull()
  })

  it('should return the ImportContentSuccess component if status is success', () => {
    const { getByTestId, queryByTestId } = setup({
      file: mockCSVFile,
      isSuccess: true
    })

    const ImportContentSuccess = getByTestId('ImportContentSuccess')
    const ImportContentBusy = queryByTestId('ImportContentBusy')
    const ImportContentWithFile = queryByTestId('ImportContentWithFile')
    const ImportContentWithoutFile = queryByTestId('ImportContentWithoutFile')
    const ImportContentServiceInProgress = queryByTestId(
      'ImportContentServiceInProgress'
    )

    expect(ImportContentSuccess).toBeInTheDocument()
    expect(ImportContentWithoutFile).toBeNull()
    expect(ImportContentWithFile).toBeNull()
    expect(ImportContentBusy).toBeNull()
    expect(ImportContentServiceInProgress).toBeNull()
  })
})
