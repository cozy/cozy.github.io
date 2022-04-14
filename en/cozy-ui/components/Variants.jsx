import React, { useState, useMemo } from 'react'
import PropTypes from 'prop-types'

import Typography from '../../react/Typography'
import Checkbox from '../../react/Checkbox'
import Paper from '../../react/Paper'
import isTesting from '../../react/helpers/isTesting'
import Radio from '../../react/Radios'
import RadioGroup from '../../react/RadioGroup'
import FormControlLabel from '../../react/FormControlLabel'

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

const VariantRadioSelector = ({ variant, onChange }) => {
  const setElement = element => {
    const newVariant = { ...variant }
    for (const key in newVariant) {
      newVariant[key] = false
    }
    onChange({ ...newVariant, [element]: true })
  }

  const selectedValue = Object.keys(variant).find(key => variant[key])

  return (
    <Paper className="u-p-1 u-mb-1" elevation={1} square>
      <Typography className="u-mb-1" variant="h5">
        Variant selector
      </Typography>
      <RadioGroup
        aria-label="radio"
        name="variantRadioSelector"
        row={true}
        value={selectedValue}
      >
        {Object.keys(variant).map((key, index) => (
          <FormControlLabel
            key={index}
            value={key}
            label={key.toUpperCase()}
            control={<Radio onChange={() => setElement(key)} />}
          />
        ))}
      </RadioGroup>
    </Paper>
  )
}

/**
 * Create an array of all possible variants
 *
 * @param {Object.<string, boolean>} initialVariants - Which features are activated by default
 * @returns {array} All possible combinations of variants
 */
export const makeAllPossibleVariants = initialVariants => {
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

/**
 * Create a table with each case to true
 *
 * @param {Object.<string, boolean>} initialVariants - Which feature is activated by default
 * @returns {array} All possible combinations of variants
 */
export const makeRadioAllPossibleVariants = initialVariants => {
  let allPossibleVariants = []
  const variantsProps = Object.keys(initialVariants[0])

  variantsProps.map(variantProp => {
    const allVariants = Object.fromEntries(
      variantsProps.map(prop => [prop, false])
    )
    allVariants[variantProp] = true

    allPossibleVariants.push(allVariants)
  })

  return allPossibleVariants
}

const Variants = ({
  initialVariants,
  screenshotAllVariants,
  radio,
  children
}) => {
  const [variants, setVariants] = useState(initialVariants)

  const onChangeVariant = (updatedVariant, i) => {
    setVariants([
      ...variants.slice(0, i),
      updatedVariant,
      ...variants.slice(i + 1)
    ])
  }

  const computedVariants = useMemo(() => {
    const allPossibleVariants = radio
      ? makeRadioAllPossibleVariants(initialVariants)
      : makeAllPossibleVariants(initialVariants)

    return isTesting() &&
      screenshotAllVariants &&
      allPossibleVariants.length <= 256 // protection to not overload Argos
      ? allPossibleVariants
      : variants
  }, [variants, initialVariants, screenshotAllVariants, radio])

  const hideVariantSelector = isTesting() && Boolean(screenshotAllVariants)

  const Selector = radio ? VariantRadioSelector : VariantSelector

  return (
    <>
      {computedVariants.map((variant, i) => (
        <React.Fragment key={i}>
          {!hideVariantSelector && (
            <Selector
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
