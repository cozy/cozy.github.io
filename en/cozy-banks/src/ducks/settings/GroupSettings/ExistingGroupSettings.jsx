import React from 'react'
import { useParams } from 'react-router-dom'

import { Q, useQuery, isQueryLoading } from 'cozy-client'

import { GROUP_DOCTYPE } from 'doctypes'
import Loading from 'components/Loading'
import BarTheme from 'ducks/bar/BarTheme'
import GroupSettings from 'ducks/settings/GroupSettings'

const ExistingGroupSettings = props => {
  const { groupId } = useParams()
  const groupCol = useQuery(Q(GROUP_DOCTYPE).getById(groupId), {
    as: `io.cozy.bank.groups__${groupId}`,
    singleDocData: true
  })

  if (isQueryLoading(groupCol)) {
    return (
      <>
        <BarTheme theme="primary" />
        <Loading />
      </>
    )
  }

  const { data: group } = groupCol
  return (
    <>
      <BarTheme theme="primary" />
      <GroupSettings group={group} {...props} />
    </>
  )
}

export default React.memo(ExistingGroupSettings)
