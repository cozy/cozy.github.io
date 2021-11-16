import React, { useState, useMemo } from 'react'
import PropTypes from 'prop-types'

import Typography from '../../react/Typography'
import Checkbox from '../../react/Checkbox'
import Paper from '../../react/Paper'
import isTesting from '../../react/helpers/isTesting'

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

/**
 * Create an array of all possible variants. Expl for {foo: true, bar: false}
 * [{ foo: true, bar: true }, { foo: false, bar: true }, { foo: false, bar: false }, { foo: true, bar: false }]
 *
 * @param {Object.<string, boolean>} initialVariants - Which features are activated by default
 * @returns {array} All possible combinations of variants
 */
const makeAllPossibleVariants = initialVariants => {
  let allPossibleVariants = [{}]

  const variantsProps = Object.keys(initialVariants[0])

  variantsProps.map(variantProp => {
    const constructArr = []
    allPossibleVariants.map(variant => {
      constructArr.push({ ...variant, [variantProp]: true })
      constructArr.push({ ...variant, [variantProp]: false })
    })

    allPossibleVariants = constructArr
  })

  return allPossibleVariants
}

const Variants = ({ initialVariants, screenshotAllVariants, children }) => {
  const [variants, setVariants] = useState(initialVariants)

  const onChangeVariant = (updatedVariant, i) => {
    setVariants([
      ...variants.slice(0, i),
      updatedVariant,
      ...variants.slice(i + 1)
    ])
  }

  const computedVariants = useMemo(() => {
    const allPossibleVariants = makeAllPossibleVariants(initialVariants)
    return isTesting() &&
      screenshotAllVariants &&
      allPossibleVariants.length <= 256 // protection to not overload Argos
      ? allPossibleVariants
      : variants
  }, [variants, initialVariants, screenshotAllVariants])

  const hideVariantSelector = isTesting() && Boolean(screenshotAllVariants)

  return (
    <>
      {computedVariants.map((variant, i) => (
        <React.Fragment key={i}>
          {!hideVariantSelector && (
            <VariantSelector
              variant={variant}
              onChange={variant => onChangeVariant(variant, i)}
            />
          )}
          {children(variant)}
        </React.Fragment>
      ))}
    </>
  )
}

export default Variants
