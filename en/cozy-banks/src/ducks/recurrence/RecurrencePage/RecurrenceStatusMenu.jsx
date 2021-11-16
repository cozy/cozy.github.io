import React from 'react'

import CozyTheme from 'cozy-ui/transpiled/react/CozyTheme'
import ActionMenu from 'cozy-ui/transpiled/react/ActionMenu'

import OngoingActionItem from 'ducks/recurrence/RecurrencePage/ActionItems/OngoingActionItem'
import FinishedActionItem from 'ducks/recurrence/RecurrencePage/ActionItems/FinishedActionItem'

const RecurrenceStatusMenu = ({
  recurrence,
  onClickOngoing,
  onClickFinished,
  ...props
}) => {
  return (
    <CozyTheme variant="normal">
      <ActionMenu {...props}>
        <OngoingActionItem recurrence={recurrence} onClick={onClickOngoing} />
        <FinishedActionItem recurrence={recurrence} onClick={onClickFinished} />
      </ActionMenu>
    </CozyTheme>
  )
}

export default React.memo(RecurrenceStatusMenu)
