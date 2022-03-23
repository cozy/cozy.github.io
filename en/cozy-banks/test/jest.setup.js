import { configure, mount, shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import logger from 'cozy-logger'
import { makeDeprecatedLifecycleMatcher, ignoreOnConditions } from './jestUtils'
import minilog from '@cozy/minilog'

// To avoid the errors while creating theme (since no CSS stylesheet
// defining CSS variables is injected during tests)
// Material-UI: the color provided to augmentColor(color) is invalid.
// The color object needs to have a `main` property or a `500` property.
jest.mock('cozy-ui/transpiled/react/utils/color', () => ({
  ...jest.requireActual('cozy-ui/transpiled/react/utils/color'),
  getCssVariableValue: () => '#fff'
}))

jest.mock('cozy-intent', () => ({
  WebviewIntentProvider: ({ children }) => children,
  useWebviewIntent: jest.fn()
}))

logger.setLevel('ERROR')

configure({ adapter: new Adapter() })

global.mount = mount
global.shallow = shallow

jest.mock('cozy-bar/transpiled', () => ({
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
  },
  Tappable: {
    reason: 'External component on which we have no control',
    matcher: makeDeprecatedLifecycleMatcher('Tappable')
  },
  Radio: {
    reason:
      'Deprecated but could be in an external component on which we have no control',
    matcher: makeDeprecatedLifecycleMatcher('Radio')
  },
  withMobileDialog: {
    reason:
      'Deprecated but could be in an external component on which we have no control',
    matcher: makeDeprecatedLifecycleMatcher('withMobileDialog')
  }
}

const callAndThrow = (fn, errorMessage) => {
  return function () {
    fn.apply(this, arguments)
    throw new Error(errorMessage)
  }
}

// Wrap console and minilog so that they throw during tests.
// Ignore warnings that we think are not problematic, see
// https://github.com/cozy/cozy-ui/issues/1318
// eslint-disable-next-line no-console
console.warn = ignoreOnConditions(
  // eslint-disable-next-line no-console
  callAndThrow(console.warn, 'console.warn should not be called during tests'),
  Object.values(ignoredWarnings).map(x => x.matcher)
)

minilog.suggest.deny(/.*/, 'warn')
minilog.pipe({
  emit: () => {},
  write: function (namespace, level, message) {
    if (level === 'warn' || level === 'error') {
      throw new Error(`${namespace}[${level}]: ${message}`)
    }
  }
})

if (process.env.TRAVIS_CI) {
  // eslint-disable-next-line no-console
  console.error = callAndThrow(
    // eslint-disable-next-line no-console
    console.error,
    'console.error should not be called during tests'
  )
}

window.__PIWIK_TRACKER_URL__ = 'https://matomo.cozycloud.cc'
window.__PIWIK_SITEID__ = 8

window.cozy = {
  bar: {
    BarLeft: () => null,
    BarCenter: () => null,
    BarRight: () => null
  }
}
// eslint-disable-next-line
process.on('unhandledRejection', r => console.log(r))
