import React from 'react'
import ReactDOM from 'react-dom'

import CozyTheme from 'cozy-ui/transpiled/react/providers/CozyTheme'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import ActionMenu from 'cozy-ui/transpiled/react/deprecated/ActionMenu'

import OngoingActionItem from 'ducks/recurrence/RecurrencePage/ActionItems/OngoingActionItem'
import FinishedActionItem from 'ducks/recurrence/RecurrencePage/ActionItems/FinishedActionItem'
import RenameActionItem from 'ducks/recurrence/RecurrencePage/ActionItems/RenameActionItem'
import DeleteActionItem from 'ducks/recurrence/RecurrencePage/ActionItems/DeleteActionItem'

// TODO We should need to do this (isMobile ? portal : identity) but see
// Cozy-UI's issue: https://github.com/cozy/cozy-ui/issues/1462
const identity = x => x
const portal = children => ReactDOM.createPortal(children, document.body)

const RecurrenceActionMenu = ({
  recurrence,
  onClickRename,
  onClickOngoing,
  onClickFinished,
  onClickDelete,
  ...props
}) => {
  const { isMobile } = useBreakpoints()
  const wrapper = isMobile ? portal : identity
  return wrapper(
    <CozyTheme variant="normal">
      <ActionMenu {...props}>
        <RenameActionItem onClick={onClickRename} />
        <DeleteActionItem onClick={onClickDelete} />
        {isMobile && (
          <>
            <hr />
            <OngoingActionItem
              recurrence={recurrence}
              onClick={onClickOngoing}
            />
            <FinishedActionItem
              recurrence={recurrence}
              onClick={onClickFinished}
            />
          </>
        )}
      </ActionMenu>
    </CozyTheme>
  )
}

export default React.memo(RecurrenceActionMenu)
