import PropTypes from 'prop-types'
import React, { useState, useCallback } from 'react'

import AccordionDetails from 'cozy-ui/transpiled/react/AccordionDetails'
import Accordion from 'cozy-ui/transpiled/react/Accordion'

import AccountsList from 'ducks/balance/AccountsList'
import { GroupEmpty } from 'ducks/balance/GroupEmpty'
import { GroupPanelSummary } from 'ducks/balance/GroupPanel/GroupPanelSummary'

const NoTransition = props => {
  const { in: open, children } = props
  if (open) {
    return children
  } else {
    return null
  }
}

const GroupPanel = ({
  group,
  groupLabel,
  onChange,
  expanded: expandedProp,
  switches,
  onSwitchChange,
  checked,
  withBalance,
  className,
  initialVisibleAccounts
}) => {
  const [optimisticExpanded, setOptimisticExpanded] = useState(expandedProp)

  const handlePanelChange = useCallback(
    async (event, expanded) => {
      // cozy-client does not do optimistic update yet
      // so we have to do it ourselves in the component
      setOptimisticExpanded(expanded)

      if (onChange) {
        await onChange(group._id, event, expanded)
      }
    },
    [onChange, group, setOptimisticExpanded]
  )

  const groupAccounts = group.accounts.data.filter(Boolean)

  const expanded =
    optimisticExpanded !== undefined ? optimisticExpanded : expandedProp

  return (
    <Accordion
      className={className}
      expanded={expanded}
      onChange={handlePanelChange}
      TransitionComponent={NoTransition}
    >
      <GroupPanelSummary
        group={group}
        groupLabel={groupLabel}
        withBalance={withBalance}
        switches={switches}
        checked={checked}
        onSwitchChange={onSwitchChange}
      />
      <AccordionDetails>
        <div className="u-flex-grow-1 u-maw-100">
          {groupAccounts && groupAccounts.length > 0 ? (
            <AccountsList
              group={group}
              switches={switches}
              onSwitchChange={onSwitchChange}
              initialVisibleAccounts={initialVisibleAccounts}
            />
          ) : (
            <GroupEmpty group={group} />
          )}
        </div>
      </AccordionDetails>
    </Accordion>
  )
}

export const DumbGroupPanel = GroupPanel

GroupPanel.propTypes = {
  group: PropTypes.object.isRequired,
  switches: PropTypes.object,
  checked: PropTypes.bool,
  expanded: PropTypes.bool.isRequired,
  onSwitchChange: PropTypes.func,
  onChange: PropTypes.func,
  withBalance: PropTypes.bool
}

GroupPanel.defaultProps = {
  withBalance: true
}

export { GroupPanel }
