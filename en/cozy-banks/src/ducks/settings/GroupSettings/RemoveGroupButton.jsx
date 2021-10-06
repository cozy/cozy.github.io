import React, { useCallback } from 'react'

import { useClient } from 'cozy-client'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Alerter from 'cozy-ui/transpiled/react/Alerter'
import Button from 'cozy-ui/transpiled/react/Button'

import { logException } from 'lib/sentry'
import { useRouter } from 'components/RouterContext'
import { trackEvent } from 'ducks/tracking/browser'

const RemoveGroupButton = ({ group }) => {
  const { t } = useI18n()
  const client = useClient()
  const router = useRouter()

  const handleRemove = useCallback(async () => {
    try {
      await client.destroy(group)
      trackEvent({
        name: 'supprimer'
      })
      router.push('/settings/groups')
    } catch (err) {
      logException(err)
      Alerter.error(t('Groups.deletion-error'))
    }
  }, [group, router, client, t])

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
