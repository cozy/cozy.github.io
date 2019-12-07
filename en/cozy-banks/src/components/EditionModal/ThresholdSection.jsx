import React from 'react'
import { ModalContent, InputGroup, Input } from 'cozy-ui/transpiled/react'
import { ModalSection } from 'components/ModalSections'

const ThresholdSection = ({ label, value, onChange }) => {
  return (
    <ModalSection label={label}>
      <ModalContent>
        <InputGroup append={<InputGroup.Unit>€</InputGroup.Unit>}>
          <Input type="text" onChange={onChange} defaultValue={value} />
        </InputGroup>
      </ModalContent>
    </ModalSection>
  )
}

export default ThresholdSection
