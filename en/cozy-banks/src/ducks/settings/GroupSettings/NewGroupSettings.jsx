import React from 'react'

import { useClient } from 'cozy-client'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import BarTheme from 'ducks/bar/BarTheme'
import GroupSettings from 'ducks/settings/GroupSettings'
import { makeNewGroup } from 'ducks/settings/GroupSettings/helpers'

/**
 * We create NewGroupSettings else react-router will reuse
 * the existing <GroupSettings /> when a new account is created and we navigate
 * to the new group settings. We could do something in componentDidUpdate
 * to refetch the group but it seems easier to do that to force the usage
 * of a brand new component
 */
const NewGroupSettings = props => {
  const { t } = useI18n()
  const client = useClient()
  return (
    <>
      <BarTheme theme="primary" />
      <GroupSettings {...props} group={makeNewGroup(client, t)} />
    </>
  )
}

export default React.memo(NewGroupSettings)
