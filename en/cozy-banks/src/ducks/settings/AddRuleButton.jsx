import React from 'react'
import Button from 'cozy-ui/transpiled/react/Button'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import Icon from 'cozy-ui/transpiled/react/Icon'

const AddRuleButton = ({ label, busy, onClick }) => (
  <Button
    color="primary"
    className="u-mt-half u-mb-0"
    size="small"
    label={label}
    disabled={busy}
    onClick={onClick}
  >
    <Icon icon={PlusIcon} className="u-mr-half" /> {label}
  </Button>
)

export default AddRuleButton
