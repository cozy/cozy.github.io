import { configure, mount, shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import logger from 'cozy-logger'

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
