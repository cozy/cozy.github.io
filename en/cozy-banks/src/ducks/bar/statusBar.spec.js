const { setTheme } = require('./statusBar')

jest.mock('cozy-ui/transpiled/react/utils/color', () => ({
  getCssVariableValue: varName => {
    if (varName == 'statusBarDefaultAndroid') {
      return '#eee'
    } else if (varName == 'statusBarDefaultIOS') {
      return '#fff'
    } else if (varName == 'statusBarPrimaryColorAndroid') {
      return '#0d60d1'
    } else if (varName == 'statusBarPrimaryColorIOS') {
      return '#297ef2'
    } else {
      throw new Error('Inexisting color')
    }
  }
}))

const setup = ({ platformId, theme }) => {
  global.cordova = { platformId }
  window.StatusBar = {
    styleBlackTranslucent: jest.fn(),
    styleDefault: jest.fn(),
    backgroundColorByHexString: jest.fn()
  }
  setTheme(theme)
}

for (let [platformId, theme, expectedStyle, expectedColor] of [
  ['android', 'primary', 'styleBlackTranslucent', '#0d60d1'],
  ['android', 'default', 'styleDefault', '#eee'],
  ['ios', 'primary', 'styleBlackTranslucent', '#297ef2'],
  ['ios', 'default', 'styleDefault', '#fff']
]) {
  it(`should work ${platformId} ${theme}`, () => {
    setup({ platformId, theme })
    expect(window.StatusBar[expectedStyle]).toHaveBeenCalled()
    expect(window.StatusBar.backgroundColorByHexString).toHaveBeenCalledWith(
      expectedColor
    )
  })
}
