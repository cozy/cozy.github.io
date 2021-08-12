import React from 'react'
import { Dialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'

function LogoutModal() {
  const { t } = useI18n()

  return (
    <Dialog
      open
      content={
        <div className="u-ta-center u-pt-3">
          <Spinner size="xxlarge" />
          <Typography variant="body1">{t('LogoutModal.message')}</Typography>
        </div>
      }
    />
  )
}

export default LogoutModal
