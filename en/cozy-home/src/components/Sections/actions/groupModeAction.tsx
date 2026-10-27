import React from 'react'
import { useNavigate } from 'react-router-dom'

import { useSettings } from 'cozy-client'
import { Action } from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Switch from 'cozy-ui/transpiled/react/Switch'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'twake-i18n'

import {
  GroupMode,
  Section,
  SectionViewProps
} from '@/components/Sections/SectionsTypes'
import {
  computeGroupMode,
  handleSectionAction
} from '@/components/Sections/utils'

export const groupModeAction = (): (() => Action) => () => ({
  name: `sectionAction_group`,
  Component: React.forwardRef<{ docs?: Section[] }>(
    function SectionActionComponent(props: { docs?: Section[] }, ref) {
      const navigate = useNavigate()
      const { t } = useI18n()
      const { isMobile } = useBreakpoints()
      const { values, save } = useSettings('home', ['shortcutsLayout'])
      const section = props.docs?.[0] as SectionViewProps['section']
      const currentGroupMode = computeGroupMode(isMobile, section)
      const handleClick = (): void => {
        handleSectionAction(
          section,
          isMobile,
          currentGroupMode === GroupMode.GROUPED
            ? GroupMode.DEFAULT
            : GroupMode.GROUPED,
          values,
          save
        )
        if (currentGroupMode === GroupMode.GROUPED) {
          navigate('/connected')
        }
      }

      return (
        /*
        // @ts-expect-error ActionsMenuItem not correctly typed */
        <ActionsMenuItem {...props} ref={ref} onClick={handleClick}>
          <ListItemText
            className="u-mr-half"
            primary={t(`sections.label_grouped`)}
          />
          <Switch
            checked={currentGroupMode === GroupMode.GROUPED}
            color="primary"
          />
        </ActionsMenuItem>
      )
    }
  )
})
