import { getCssVariableValue } from 'cozy-ui/react/utils/color'

export const setColor = color => {
  if (!window.StatusBar) {
    return
  }
  window.StatusBar.backgroundColorByHexString(color)
}

const THEME_TO_COLORS = {
  primary: 'statusBarPrimaryColor',
  default: 'coolGrey'
}

export const setTheme = theme => {
  const color = THEME_TO_COLORS[theme] || THEME_TO_COLORS.default
  setColor(getCssVariableValue(color))
}
