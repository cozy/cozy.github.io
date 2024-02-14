import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { useClient } from 'cozy-client'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'
import Button from 'cozy-ui/transpiled/react/deprecated/Button'

import logger from 'lib/logger'
import { trackEvent } from 'ducks/tracking/browser'

const RemoveGroupButton = ({ group }) => {
  const { t } = useI18n()
  const client = useClient()
  const navigate = useNavigate()

  const handleRemove = useCallback(async () => {
    try {
      await client.destroy(group)
      trackEvent({
        name: 'supprimer'
      })
      navigate('/settings/groups')
    } catch (err) {
      logger.error(err)
      Alerter.error(t('Groups.deletion-error'))
    }
  }, [group, navigate, client, t])

  return (
    <Button
      className="u-mt-1 u-ml-0"
      theme="danger-outline"
      onClick={handleRemove}
      label={t('Groups.delete')}
    />
  )
}

export default React.memo(RemoveGroupButton)
