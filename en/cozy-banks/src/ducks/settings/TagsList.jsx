import React, { Fragment } from 'react'
import PropTypes from 'prop-types'

import makeStyles from 'cozy-ui/transpiled/react/helpers/makeStyles'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import Divider from 'cozy-ui/transpiled/react/MuiCozyTheme/Divider'
import List from 'cozy-ui/transpiled/react/MuiCozyTheme/List'

import TagListItem from 'ducks/settings/TagListItem'
import { filterTags, sortTags } from 'ducks/settings/tagsSettingsHelpers'

const useStyles = makeStyles({
  list: {
    padding: '.5rem 0'
  },
  desktopDivider: {
    marginLeft: '5rem'
  }
})

const TagsList = ({ tags, filter, sort }) => {
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
        {filteredAndSortedTags.map((tag, index) => {
          return (
            <Fragment key={tag._id}>
              {index !== 0 && (
                <Divider
                  variant="inset"
                  component="li"
                  className={!isMobile ? styles.desktopDivider : null}
                />
              )}
              <TagListItem tag={tag} />
            </Fragment>
          )
        })}
      </List>
      {isMobile && <Divider />}
    </>
  )
}

TagsList.propTypes = {
  tags: PropTypes.array.isRequired,
  filter: PropTypes.string.isRequired,
  sort: PropTypes.string.isRequired
}

export default TagsList
