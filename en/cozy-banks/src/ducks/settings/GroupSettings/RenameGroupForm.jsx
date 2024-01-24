import React, { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { useClient } from 'cozy-client'
import { Media, Img } from 'cozy-ui/transpiled/react/deprecated/Media'
import Input from 'cozy-ui/transpiled/react/Input'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Button from 'cozy-ui/transpiled/react/deprecated/Button'
import Typography from 'cozy-ui/transpiled/react/Typography'

import { getGroupLabel, renamedGroup } from 'ducks/groups/helpers'
import { trackEvent } from 'ducks/tracking/browser'

import styles from 'ducks/settings/GroupsSettings.styl'

const RenameGroupForm = props => {
  const [modifying, setModifying] = useState(false)
  const [saving, setSaving] = useState(false)
  const client = useClient()
  const navigate = useNavigate()
  const inputRef = useRef()
  const { t } = useI18n()

  const { group } = props

  const handleRename = useCallback(async () => {
    setSaving(true)
    const updatedGroup = renamedGroup(group, inputRef.current.value)

    try {
      const res = await client.save(updatedGroup)
      const doc = res?.data
      if (doc && !updatedGroup.id) {
        navigate(`/settings/groups/${doc.id}`)
      }
    } finally {
      setSaving(false)
      setModifying(false)
      trackEvent({
        name: 'renommer'
      })
    }
  }, [client, group, navigate])

  const handleModifyName = useCallback(() => {
    setModifying(true)
  }, [setModifying])

  return (
    <form className={styles.GrpStg__form} onSubmit={e => e.preventDefault()}>
      <Media>
        <Img>
          {!modifying ? (
            <Typography variant="body1">{getGroupLabel(group, t)}</Typography>
          ) : (
            <Input
              ref={inputRef}
              placeholder={t('Groups.name-placeholder')}
              autoFocus
              type="text"
              defaultValue={getGroupLabel(group, t)}
            />
          )}
        </Img>
        <Img>
          {modifying ? (
            <Button
              disabled={saving}
              theme="regular"
              onClick={handleRename}
              label={t('Groups.save')}
              busy={saving}
            />
          ) : (
            <Button
              theme="text"
              onClick={handleModifyName}
              label={t('Groups.rename')}
            />
          )}
        </Img>
      </Media>
    </form>
  )
}

export default React.memo(RenameGroupForm)
