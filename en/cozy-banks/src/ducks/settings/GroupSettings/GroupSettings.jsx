import React, { useEffect } from 'react'
import { Query, isQueryLoading } from 'cozy-client'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Typography from 'cozy-ui/transpiled/react/Typography'
import Stack from 'cozy-ui/transpiled/react/Stack'

import { accountsConn } from 'doctypes'
import { getGroupLabel } from 'ducks/groups/helpers'
import { trackPage } from 'ducks/tracking/browser'

import Loading from 'components/Loading'
import BackButton from 'components/BackButton'
import { PageTitle } from 'components/Title'
import Padded from 'components/Padded'
import RemoveGroupButton from 'ducks/settings/GroupSettings/RemoveGroupButton'
import AccountsList from 'ducks/settings/GroupSettings/AccountsList'
import RenameGroupForm from 'ducks/settings/GroupSettings/RenameGroupForm'

const stackStyle = { clear: 'left' }

const GroupSettings = props => {
  const { group } = props
  const { t } = useI18n()

  useEffect(() => {
    if (group) {
      if (group._id) {
        trackPage('parametres:groupes:detail')
      } else {
        trackPage('parametres:groupes:nouveau-groupe')
      }
    }
  }, [group])

  // When deleting the group, there's a re-render between the deletion and the redirection. So we need to handle this case
  if (!group) {
    return null
  }

  return (
    <Padded>
      <div className="u-flex u-flex-items-center  u-mb-1">
        <BackButton to="/settings/groups" arrow />
        <PageTitle className="u-flex u-items-center">
          {getGroupLabel(group, t)}
        </PageTitle>
      </div>

      <Stack spacing="s" style={stackStyle}>
        <div>
          <Typography variant="h5">{t('Groups.label')}</Typography>
          <RenameGroupForm group={group} />
        </div>
        <div>
          <Typography variant="h5" gutterBottom>
            {t('Groups.accounts')}
          </Typography>
          <Query query={accountsConn.query} as={accountsConn.as}>
            {accountsCol => {
              const { data: accounts } = accountsCol
              if (isQueryLoading(accountsCol)) {
                return <Loading />
              }

              return <AccountsList accounts={accounts} group={group} />
            }}
          </Query>
        </div>
        <RemoveGroupButton group={group} />
      </Stack>
    </Padded>
  )
}

export default React.memo(GroupSettings)
