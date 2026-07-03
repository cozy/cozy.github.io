import React from 'react'

import { Icon, Assistant } from '@linagora/twake-icons'
import { AssistantLink } from 'cozy-search'
import SquareAppIcon from 'cozy-ui-plus/dist/SquareAppIcon'

/**
 * AssistantTile component.
 *
 * @returns {JSX.Element} The rendered AssistantTile component.
 */
const AssistantTile = () => {
  return (
    <AssistantLink>
      {({ openAssistant }) => (
        <a onClick={openAssistant} className="scale-hover">
          <SquareAppIcon
            name="Assistant"
            IconContent={
              <Icon icon={Assistant} size={24} color="var(--primaryColor)" />
            }
          />
        </a>
      )}
    </AssistantLink>
  )
}

export default AssistantTile
