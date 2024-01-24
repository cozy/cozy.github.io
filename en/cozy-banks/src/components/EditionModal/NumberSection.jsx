import React from 'react'

import { DialogContent } from 'cozy-ui/transpiled/react/Dialog'
import InputGroup from 'cozy-ui/transpiled/react/InputGroup'
import Input from 'cozy-ui/transpiled/react/Input'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import { DialogSection } from 'components/DialogSections'

const NumberSection = ({ label, value, onChange, unit, unitKey }) => {
  const { t } = useI18n()
  const handleChange = ev => {
    onChange(parseInt(ev.target.value, 10))
  }
  return (
    <DialogSection label={label}>
      <DialogContent className="u-pv-0">
        <InputGroup
          append={
            unit || unitKey ? (
              <InputGroup.Unit>{unit || t(unitKey)}</InputGroup.Unit>
            ) : undefined
          }
        >
          <Input type="text" onChange={handleChange} defaultValue={value} />
        </InputGroup>
      </DialogContent>
    </DialogSection>
  )
}

export default NumberSection
