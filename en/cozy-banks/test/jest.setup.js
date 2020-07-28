import { configure, mount, shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import logger from 'cozy-logger'
import { makeDeprecatedLifecycleMatcher, ignoreOnConditions } from './jestUtils'

// To avoid the errors while creating theme (since no CSS stylesheet
// defining CSS variables is injected during tests)
// Material-UI: the color provided to augmentColor(color) is invalid.
// The color object needs to have a `main` property or a `500` property.
jest.mock('cozy-ui/transpiled/react/utils/color', () => ({
  getCssVariableValue: () => '#fff'
}))

logger.setLevel('ERROR')

configure({ adapter: new Adapter() })

global.mount = mount
global.shallow = shallow

jest.mock('cozy-bar/dist/cozy-bar', () => ({
  BarLeft: () => null,
  BarRight: ({ children }) => children,
  BarCenter: () => null,
  setTheme: () => null
}))

const ignoredWarnings = {
  Select: {
    reason: 'False positive',
    matcher: makeDeprecatedLifecycleMatcher('Select')
  },
  I18n: {
    reason: 'Preact compatibility',
    matcher: makeDeprecatedLifecycleMatcher('I18n')
  },
  ModalContent: {
    reason: 'Preact compatibility',
    matcher: makeDeprecatedLifecycleMatcher('ModalContent')
  },
  ReactSwipableView: {
    reason: 'External component on which we have no control',
    matcher: makeDeprecatedLifecycleMatcher('ReactSwipableView')
  }
}

const callAndThrow = (fn, errorMessage) => {
  return function() {
    fn.apply(this, arguments)
    throw new Error(errorMessage)
  }
}

// Ignore warnings that we think are not problematic, see
// https://github.com/cozy/cozy-ui/issues/1318
// eslint-disable-next-line no-console
console.warn = ignoreOnConditions(
  // eslint-disable-next-line no-console
  callAndThrow(console.warn, 'console.warn should not be called during tests'),
  Object.values(ignoredWarnings).map(x => x.matcher)
)

if (process.env.TRAVIS_CI) {
  // eslint-disable-next-line no-console
  console.error = callAndThrow(
    // eslint-disable-next-line no-console
    console.error,
    'console.error should not be called during tests'
  )
}
