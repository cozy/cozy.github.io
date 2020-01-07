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

global.cozy = {
  bar: {
    BarLeft: () => null,
    BarRight: ({ children }) => children,
    BarCenter: () => null,
    setTheme: () => null
  }
}

const ignoredWarnings = {
  I18n: {
    reason: 'Preact compatibility',
    matcher: makeDeprecatedLifecycleMatcher('I18n')
  },
  ModalContent: {
    reason: 'Preact compatibility',
    matcher: makeDeprecatedLifecycleMatcher('ModalContent')
  },

  // Until we upgrade react-redux to > 5, we will have deprecated lifecycle
  // methods on connected components
  ConnectedRedux: {
    reason: 'Wrapped in Connect()',
    matcher: makeDeprecatedLifecycleMatcher('Connect(')
  }
}

// Ignore warnings that we think are not problematic, see
// https://github.com/cozy/cozy-ui/issues/1318
// eslint-disable-next-line no-console
console.warn = ignoreOnConditions(
  // eslint-disable-next-line no-console
  console.warn,
  Object.values(ignoredWarnings).map(x => x.matcher)
)
