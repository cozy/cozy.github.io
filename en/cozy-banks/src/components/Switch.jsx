import Switch from '@material-ui/core/Switch'
import { withStyles } from '@material-ui/core/styles'

const BAR_WIDTH = 25
const BAR_HEIGHT = 12
const BUTTON_WIDTH = 46

export default withStyles(() => ({
  root: {
    width: BUTTON_WIDTH,
    '& input': {
      width: '150%',
      height: '150%',
      left: '-25%',
      top: '-25%'
    }
  },
  switchBase: {
    width: BUTTON_WIDTH,
    transform: 'translateX(-7px)'
  },
  checked: {
    '& + $bar': {
      opacity: 1
    },
    transform: 'translateX(7px)'
  },
  icon: {
    width: 16,
    height: 16
  },
  bar: {
    width: BAR_WIDTH,
    height: 12,
    marginTop: -(BAR_HEIGHT / 2),
    marginLeft: -(BAR_WIDTH / 2),
    backgroundColor: 'var(--silver)',
    opacity: 1
  },
  colorPrimary: {
    '&$checked': {
      color: 'white'
    }
  },
  colorSecondary: {
    '&$checked': {
      color: 'white'
    }
  }
}))(Switch)
