import React, { useState, useCallback } from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/deprecated/Media'
import Button, { ButtonLink } from 'cozy-ui/transpiled/react/deprecated/Button'
import Stack from 'cozy-ui/transpiled/react/Stack'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useClient } from 'cozy-client'

const GroupEmpty = ({ group }) => {
  const client = useClient()
  const { t } = useI18n()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    try {
      await client.destroy(group)
    } catch (e) {
      setDeleting(false)
    }
  }, [client, group])

  return (
    <Stack className="u-m-1">
      <Typography variant="body1">
        {t('Balance.no-accounts-in-group.description')}
      </Typography>
      <Media>
        <Bd>
          <ButtonLink
            className="u-ml-0"
            href={`#/settings/groups/${group._id}`}
          >
            {t('Balance.no-accounts-in-group.button')}
          </ButtonLink>
        </Bd>
        <Img>
          <Button
            theme="text"
            busy={deleting}
            label={t('Groups.delete')}
            onClick={handleDelete}
          />
        </Img>
      </Media>
    </Stack>
  )
}

export { GroupEmpty }
