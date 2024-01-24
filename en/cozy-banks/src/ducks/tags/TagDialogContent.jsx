import React from 'react'
import PropTypes from 'prop-types'

import { buildTransactionsWithTagsQueryByIds } from 'doctypes'
import { hasQueryBeenLoaded, isQueryLoading, useQueryAll } from 'cozy-client'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Typography from 'cozy-ui/transpiled/react/Typography'

import Loading from 'components/Loading'
import Padded from 'components/Padded'
import TagDeleteTagModal from 'components/Tag/TagDeleteTagModal'
import TagRenameTagModal from 'components/Tag/TagRenameTagModal'
import { TransactionList } from 'ducks/transactions/Transactions'
import { DESKTOP_SCROLLING_ELEMENT_CLASSNAME } from 'ducks/transactions/scroll/getScrollingElement'

const TagDialogContent = ({
  tag,
  isRenameModalOpened,
  setIsRenameModalOpened,
  isDeleteModalOpened,
  setIsDeleteModalOpened
}) => {
  const { t } = useI18n()
  const transactionsQueryByIds = buildTransactionsWithTagsQueryByIds(
    tag.transactions.data.map(transaction => transaction._id)
  )
  const response = useQueryAll(
    transactionsQueryByIds.definition,
    transactionsQueryByIds.options
  )
  const isFetching = isQueryLoading(response) && !hasQueryBeenLoaded(response)

  let content = null

  if (isFetching) {
    content = <Loading loadingType="movements" />
  } else if (response.data.length === 0) {
    content = (
      <Padded className="u-pt-0">
        <Typography variant="body1">
          {t('Transactions.no-movements')}
        </Typography>
      </Padded>
    )
  } else {
    content = (
      <div className={DESKTOP_SCROLLING_ELEMENT_CLASSNAME}>
        <TransactionList
          transactions={response.data}
          canFetchMore={response.hasMore}
          filteringOnAccount={false}
        />
      </div>
    )
  }

  return (
    <>
      {content}
      {isRenameModalOpened && (
        <TagRenameTagModal
          tag={tag}
          onClose={() => setIsRenameModalOpened(false)}
        />
      )}
      {isDeleteModalOpened && (
        <TagDeleteTagModal
          tag={tag}
          transactions={response.data}
          onClose={() => setIsDeleteModalOpened(false)}
        />
      )}
    </>
  )
}

TagDialogContent.propTypes = {
  tag: PropTypes.object.isRequired,
  isRenameModalOpened: PropTypes.bool.isRequired,
  setIsRenameModalOpened: PropTypes.func.isRequired,
  isDeleteModalOpened: PropTypes.bool.isRequired,
  setIsDeleteModalOpened: PropTypes.func.isRequired
}

export default TagDialogContent
