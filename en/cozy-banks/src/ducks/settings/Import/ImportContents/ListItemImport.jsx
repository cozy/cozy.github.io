import React from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import CrossIcon from 'cozy-ui/transpiled/react/Icons/CrossCircle'
import FileIcon from 'cozy-ui/transpiled/react/Icons/FileTypeSheet'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon, { smallSize } from 'cozy-ui/transpiled/react/ListItemIcon'
import Paper from 'cozy-ui/transpiled/react/Paper'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

const ListItemImport = ({ file, setFile, isBusy }) => {
  return (
    <List>
      <Paper elevation={2} className="u-mh-half">
        <ListItem button disabled={isBusy} className="u-pr-0">
          <ListItemIcon>
            <Icon icon={FileIcon} size={32} />
          </ListItemIcon>
          <ListItemText primary={file.name} />
          <IconButton
            data-testid="ListItemImport"
            onClick={() => setFile(null)}
          >
            <Icon
              icon={CrossIcon}
              size={smallSize}
              color="var(--secondaryColorDark)"
            />
          </IconButton>
        </ListItem>
      </Paper>
    </List>
  )
}

export default ListItemImport
