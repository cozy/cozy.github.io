import palette from 'cozy-ui/transpiled/react/palette'

// Colors are legacy and do not adapt to the theme yet. That's why we using the palette directly.
// Warning this code is also executed on the server side.
// TODO : Adapt colors to the theme in cozy-ui
export default {
  kids: palette['azure'],
  dailyLife: palette['melon'],
  educationAndTraining: palette['blazeOrange'],
  health: palette['pomegranate'],
  homeAndRealEstate: palette['mango'],
  incomeCat: palette['emerald'],
  activities: palette['fuchsia'],
  excludeFromBudgetCat: palette['darkPeriwinkle'],
  services: palette['purpley'],
  tax: palette['lightishPurple'],
  transportation: palette['puertoRico'],
  goingOutAndTravel: palette['weirdGreen'],
  uncategorized: '#95999D' // Chart.js can't manage var() color
}
