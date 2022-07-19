import React from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import TagIcon from 'cozy-ui/transpiled/react/Icons/Tag'

import { hasAtLeastFiveTags } from 'ducks/transactions/helpers'
import TagAdd from 'components/Tag/TagAdd'
import TagChips from 'components/Tag/TagChips'

const TagListItem = ({ transaction }) => {
  return (
    <>
      <ListItem divider button disableRipple>
        <ListItemIcon>
          <Icon icon={TagIcon} />
        </ListItemIcon>
        <ListItemText
          ellipsis={false}
          primary={
            <>
              <TagChips transaction={transaction} deletable />
              <TagAdd
                transaction={transaction}
                disabled={hasAtLeastFiveTags(transaction)}
              />
            </>
          }
        />
      </ListItem>
    </>
  )
}

export default TagListItem
