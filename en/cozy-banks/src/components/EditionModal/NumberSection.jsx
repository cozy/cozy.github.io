import React from 'react'
import {
  ModalContent,
  InputGroup,
  Input,
  useI18n
} from 'cozy-ui/transpiled/react'
import { ModalSection } from 'components/ModalSections'

const NumberSection = ({ label, value, onChange, unit, unitKey }) => {
  const { t } = useI18n()
  const handleChange = ev => {
    onChange(parseInt(ev.target.value, 10))
  }
  return (
    <ModalSection label={label}>
      <ModalContent className="u-pb-0">
        <InputGroup
          append={
            unit || unitKey ? (
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

export default NumberSection
