import React, { useState } from 'react'
import PropTypes from 'prop-types'

import Typography from '../../react/Typography'
import Checkbox from '../../react/Checkbox'
import Paper from '../../react/Paper'

/**
 * Useful for components for which there are variants, this component
 * takes an object representing a variant (a mapping from string to boolean
 * representing features of the component that are activated in the variant),
 * shows checkboxes showing which feature is activated and through the onChange
 * prop, enables the update of the variant.
 *
 * @param  {Object.<string, boolean>} options.variant - Which features are activated in the variant
 * @param  {Function} options.onChange - Called with the updated variant when a checkbox is clicked
 */
const VariantSelector = ({ variant, onChange }) => {
  const setElement = (element, newValue) => {
    const newVariant = { ...variant, [element]: newValue }
    onChange(newVariant)
  }

  return (
    <Paper className="u-p-1 u-mb-1" elevation={1} square>
      <Typography className="u-mb-1" variant="h5">
        Variant selector
      </Typography>
      {Object.entries(variant).map(([element, value], i) => (
        <Checkbox
          key={i}
          label={element.toUpperCase()}
          checked={value}
          onChange={() => setElement(element, !value)}
        />
      ))}
    </Paper>
  )
}

VariantSelector.propTypes = {
  /** Called with the updated variant when a checkbox is clicked */
  onChange: PropTypes.func.isRequired,
  /** @type {Object.<string, boolean>} Which features are activated in the variant */
  variant: PropTypes.object.isRequired
}

const Variants = ({ initialVariants, children }) => {
  const [variants, setVariants] = useState(initialVariants)

  const onChangeVariant = (updatedVariant, i) => {
    setVariants([
      ...variants.slice(0, i),
      updatedVariant,
      ...variants.slice(i + 1)
    ])
  }

  return (
    <>
      {variants.map((variant, i) => (
        <React.Fragment key={i}>
          <VariantSelector
            variant={variant}
            onChange={variant => onChangeVariant(variant, i)}
          />
          {children(variant)}
        </React.Fragment>
      ))}
    </>
  )
}

export default Variants
