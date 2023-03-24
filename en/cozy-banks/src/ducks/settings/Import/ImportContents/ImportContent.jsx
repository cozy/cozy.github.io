import React from 'react'

import ImportContentWithoutFile from 'ducks/settings/Import/ImportContents/ImportContentWithoutFile'
import ImportContentBusy from 'ducks/settings/Import/ImportContents/ImportContentBusy'
import ImportContentSuccess from 'ducks/settings/Import/ImportContents/ImportContentSuccess'
import ImportContentServiceInProgress from 'ducks/settings/Import/ImportContents/ImportContentServiceInProgress'
import ImportContentWithFile from 'ducks/settings/Import/ImportContents/ImportContentWithFile'

const ImportContent = ({
  file,
  setFile,
  isBusy,
  isSuccess,
  isServiceInProgress
}) => {
  if (!file) {
    return <ImportContentWithoutFile setFile={setFile} />
  }
  if (isBusy) {
    return <ImportContentBusy setFile={setFile} file={file} />
  }
  if (isServiceInProgress) {
    return <ImportContentServiceInProgress setFile={setFile} file={file} />
  }
  if (isSuccess) {
    return <ImportContentSuccess setFile={setFile} file={file} />
  }

  return <ImportContentWithFile setFile={setFile} file={file} />
}

export default ImportContent
