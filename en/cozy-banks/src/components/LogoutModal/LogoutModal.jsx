import React from 'react'
import { Dialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'

function LogoutModal() {
  const { t } = useI18n()

  return (
    <Dialog
      open
      content={
        <>
          <Spinner size="xxlarge" />
          <p>{t('LogoutModal.message')}</p>
        </>
      }
    />
  )
}

export default LogoutModal
