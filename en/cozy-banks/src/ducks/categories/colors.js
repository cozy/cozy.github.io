import isNode from 'detect-node'
import palette from 'cozy-ui/transpiled/react/palette'
import { getCssVariableValue } from 'cozy-ui/transpiled/react/utils/color'

const getColor = color =>
  isNode ? palette[color] : getCssVariableValue(color) || palette[color]

export default {
  kids: getColor('azure'),
  dailyLife: getColor('melon'),
  educationAndTraining: getColor('blazeOrange'),
  health: getColor('pomegranate'),
  homeAndRealEstate: getColor('mango'),
  incomeCat: getColor('emerald'),
  activities: getColor('fuchsia'),
  excludeFromBudgetCat: getColor('darkPeriwinkle'),
  services: getColor('purpley'),
  tax: getColor('lightishPurple'),
  transportation: getColor('puertoRico'),
  goingOutAndTravel: getColor('weirdGreen'),
  uncategorized: getColor('coolGrey')
}
