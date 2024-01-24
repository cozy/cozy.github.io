import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from 'cozy-ui/transpiled/react/styles'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

import SearchInput from 'components/SearchInput'
import SelectInput from 'components/SelectInput'
import { Unpadded } from 'components/Padded'
import TagAddNewTagModal from 'components/Tag/TagAddNewTagModal'
import TagsList from 'ducks/settings/TagsList'

const useStyles = makeStyles({
  mobileBox: {
    display: 'flex',
    flexDirection: 'column',
    padding: '.5rem',
    gap: '.5rem'
  },
  desktopBox: {
    display: 'flex',
    flexDirection: 'row',
    margin: '2rem 2rem 1rem 2rem',
    gap: '.625rem'
  }
})

const TagsListSettings = ({ tags }) => {
  const { isMobile } = useBreakpoints()
  const styles = useStyles()
  const { t } = useI18n()
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState('label-asc')
  const [isCreateModalOpened, setIsCreateModalOpened] = useState(false)

  const filterPlaceholder = t('Tag.search-tag')

  const sortOptions = {
    'label-asc': t('Tag.sortLabelAsc'),
    'label-desc': t('Tag.sortLabelDesc'),
    'transactions.count-desc': t('Tag.sortCountDesc'),
    'transactions.count-asc': t('Tag.sortCountAsc')
  }

  return (
    <Unpadded horizontal vertical>
      <div className={isMobile ? styles.mobileBox : styles.desktopBox}>
        <SearchInput placeholder={filterPlaceholder} setValue={setFilter} />
        <SelectInput
          options={sortOptions}
          name="sort"
          value={sort}
          setValue={setSort}
        />
      </div>
      <TagsList
        tags={tags}
        filter={filter}
        sort={sort}
        setIsCreateModalOpened={setIsCreateModalOpened}
      />
      {isCreateModalOpened && (
        <TagAddNewTagModal onClose={() => setIsCreateModalOpened(false)} />
      )}
    </Unpadded>
  )
}

TagsList.propTypes = {
  tags: PropTypes.array.isRequired
}

export default TagsListSettings
