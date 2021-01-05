import React, { useState } from 'react'
import PropTypes from 'prop-types'
import Typography from '../../react/Typography'

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
const VariantInfo = ({ variant, onChange }) => {
  const setElement = (element, newValue) => {
    const newVariant = { ...variant, [element]: newValue }
    onChange(newVariant)
  }
  return (
    <div className="u-m-1">
      {Object.entries(variant).map(([element, value], i) => (
        <React.Fragment key={i}>
          <Typography component="span" variant="button" className="u-dib">
            {element}
            <input
              onClick={() => setElement(element, !value)}
              className="u-ml-1 u-mr-1"
              type="checkbox"
              checked={value}
            />
          </Typography>{' '}
        </React.Fragment>
      ))}
    </div>
  )
}

VariantInfo.propTypes = {
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
          <VariantInfo
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
