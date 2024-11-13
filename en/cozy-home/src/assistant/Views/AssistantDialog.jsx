import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { FixedDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import CozyTheme from 'cozy-ui/transpiled/react/providers/CozyTheme'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import Conversation from '../Conversations/Conversation'
import ConversationBar from '../Conversations/ConversationBar'
import AssistantProvider, { useAssistant } from '../AssistantProvider'

const AssistantDialog = () => {
  const { assistantState } = useAssistant()
  const { isMobile } = useBreakpoints()
  const navigate = useNavigate()
  const { conversationId } = useParams()

  const onClose = () => {
    navigate('..')
  }

  return (
    <FixedDialog
      open
      fullScreen
      size="full"
      componentsProps={{
        dialogTitle: { className: isMobile ? 'u-ph-0' : '' },
        dialogActions: { className: isMobile ? 'u-mh-half' : 'u-mb-2' },
        divider: { className: 'u-dn' }
      }}
      title={isMobile ? ' ' : ' '}
      content={<Conversation id={conversationId} />}
      actions={<ConversationBar assistantStatus={assistantState.status} />}
      onClose={onClose}
    />
  )
}

const AssistantDialogWithProviders = () => {
  return (
    <CozyTheme variant="normal">
      <AssistantProvider>
        <AssistantDialog />
      </AssistantProvider>
    </CozyTheme>
  )
}

export default AssistantDialogWithProviders
