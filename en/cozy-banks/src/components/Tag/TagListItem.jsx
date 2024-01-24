import React from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import TagIcon from 'cozy-ui/transpiled/react/Icons/Tag'

import { hasAtLeastFiveTags } from 'ducks/transactions/helpers'
import TagAdd from 'components/Tag/TagAdd'
import TagChips from 'components/Tag/TagChips'

const TagListItem = ({ transaction, withIcon }) => {
  return (
    <ListItem divider>
      <ListItemIcon>
        <Icon icon={TagIcon} />
      </ListItemIcon>
      <ListItemText
        ellipsis={false}
        primary={
          <>
            <TagChips transaction={transaction} deletable withIcon={withIcon} />
            <TagAdd
              transaction={transaction}
              disabled={hasAtLeastFiveTags(transaction)}
            />
          </>
        }
      />
    </ListItem>
  )
}

export default TagListItem
