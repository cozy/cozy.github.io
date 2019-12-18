import React from 'react'
import { ModalContent, InputGroup, Input } from 'cozy-ui/transpiled/react'
import { ModalSection } from 'components/ModalSections'
import { translate } from 'cozy-ui/transpiled/react'

const NumberSection = ({ label, value, onChange, unit, unitKey, t }) => {
  const handleChange = ev => {
    onChange(parseInt(ev.target.value, 10))
  }
  return (
    <ModalSection label={label}>
      <ModalContent className="u-pb-0">
        <InputGroup
          append={
            unit ? (
              <InputGroup.Unit>{unit || t(unitKey)}</InputGroup.Unit>
            ) : (
              undefined
            )
          }
        >
          <Input type="text" onChange={handleChange} defaultValue={value} />
        </InputGroup>
      </ModalContent>
    </ModalSection>
  )
}

export default translate()(NumberSection)
