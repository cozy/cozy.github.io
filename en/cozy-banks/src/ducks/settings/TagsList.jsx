import React, { Fragment } from 'react'
import PropTypes from 'prop-types'

import { makeStyles } from 'cozy-ui/transpiled/react/styles'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import Divider from 'cozy-ui/transpiled/react/Divider'
import List from 'cozy-ui/transpiled/react/List'

import TagListItem from 'ducks/settings/TagListItem'
import TagCreateListItem from 'ducks/settings/TagCreateListItem'
import { filterTags, sortTags } from 'ducks/settings/tagsSettingsHelpers'

const useStyles = makeStyles({
  list: {
    padding: '.5rem 0'
  },
  desktopDivider: {
    marginLeft: '5rem'
  }
})

const TagsList = ({ tags, filter, sort, setIsCreateModalOpened }) => {
  const { isMobile } = useBreakpoints()
  const styles = useStyles()
  const [sortKey, sortOrder] = sort.split('-')
  const filteredAndSortedTags = sortTags(
    filterTags(tags, filter),
    sortKey,
    sortOrder
  )

  return (
    <>
      {isMobile && filteredAndSortedTags.length !== 0 && <Divider />}
      <List className={styles.list}>
        {filteredAndSortedTags.map(tag => {
          return (
            <Fragment key={tag._id}>
              <TagListItem tag={tag} />
              <Divider
                variant="inset"
                component="li"
                className={!isMobile ? styles.desktopDivider : null}
              />
            </Fragment>
          )
        })}
        <TagCreateListItem setIsCreateModalOpened={setIsCreateModalOpened} />
      </List>
      {isMobile && <Divider />}
    </>
  )
}

TagsList.propTypes = {
  tags: PropTypes.array.isRequired,
  filter: PropTypes.string.isRequired,
  sort: PropTypes.string.isRequired,
  setIsCreateModalOpened: PropTypes.func.isRequired
}

export default TagsList
