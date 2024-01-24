import React from 'react'

import { tagsConn } from 'doctypes'
import { useQueryAll, isQueryLoading } from 'cozy-client'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Spinner from 'cozy-ui/transpiled/react/Spinner'

import TagsListSettings from 'ducks/settings/TagsListSettings'
import { useTrackPage } from 'ducks/tracking/browser'

const TagsSettings = () => {
  const { t } = useI18n()
  const response = useQueryAll(tagsConn.query, tagsConn)
  const hasFailed = response.fetchStatus === 'failed'

  useTrackPage('parametres:labels')

  if (hasFailed) {
    return (
      <>
        <p>{t('Loading.error')}</p>
        <p>{response.lastError?.message}</p>
      </>
    )
  }

  const isLoading = isQueryLoading(response) || response.hasMore

  if (isLoading) {
    return (
      <Spinner
        size="xxlarge"
        className="u-flex u-flex-justify-center u-mt-2 u-h-5"
      />
    )
  }

  return <TagsListSettings tags={response.data} />
}

export default TagsSettings
