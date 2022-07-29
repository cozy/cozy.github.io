import React from 'react'

import { buildTagsQueryWithTransactionsByIds } from 'doctypes'
import { useQueryAll, isQueryLoading } from 'cozy-client'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Spinner from 'cozy-ui/transpiled/react/Spinner'

import { useLocation } from 'components/RouterContext'
import TagDialog from 'ducks/tags/TagDialog'

const TagPage = () => {
  const { pathname } = useLocation()
  const tagId = pathname.split('/').pop()
  const { t } = useI18n()

  const tagsQueryByIds = buildTagsQueryWithTransactionsByIds([tagId])
  const response = useQueryAll(
    tagsQueryByIds.definition,
    tagsQueryByIds.options
  )
  const hasFailed = response.fetchStatus === 'failed'

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

  if (response.data.length === 0) {
    return null
  }

  return <TagDialog tag={response.data[0]} />
}

export default TagPage
