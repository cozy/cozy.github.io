import React from 'react'
import { ModalContent, InputGroup, Input } from 'cozy-ui/transpiled/react'
import { ModalSection } from 'components/ModalSections'

const NumberSection = ({ label, value, onChange, unit }) => {
  const handleChange = ev => {
    onChange(parseInt(ev.target.value, 10))
  }
  return (
    <ModalSection label={label}>
      <ModalContent>
        <InputGroup
          append={unit ? <InputGroup.Unit>{unit}</InputGroup.Unit> : null}
        >
          <Input type="text" onChange={handleChange} defaultValue={value} />
        </InputGroup>
      </ModalContent>
    </ModalSection>
  )
}

export default NumberSection
