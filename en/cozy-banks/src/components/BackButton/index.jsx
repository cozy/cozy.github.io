/* global cozy */

import React from 'react'
import PropTypes from 'prop-types'
import styles from 'components/BackButton/style.styl'
import withBackSwipe from 'utils/backSwipe'
import { flowRight as compose } from 'lodash'
import { withBreakpoints } from 'cozy-ui/react'
import Icon from 'cozy-ui/react/Icon'
import arrowLeft from 'assets/icons/icon-arrow-left.svg'
import { getCssVariableValue } from 'cozy-ui/react/utils/color'

const { BarLeft } = cozy.bar

export const BackButtonMobile = ({ onClick, theme }) => {
  const arrowColor =
    theme === 'primary'
      ? getCssVariableValue('primaryContrastTextColor')
      : getCssVariableValue('coolGrey')
  return (
    <BarLeft>
      <button className="coz-bar-btn coz-bar-burger" onClick={onClick}>
        <Icon icon={arrowLeft} color={arrowColor} />
      </button>
    </BarLeft>
  )
}

/**
 * Display a BackButton on mobile. When it is displayed,
 * a right swipe on the screen or a click will bring
 * the user back to `to`.
 *
 * ```jsx
 * <BackButton onClick={ console.log('back button' )} />
 * <BackButton to={ '/settings' } />
 * ```
 */
const BackButton = ({
  onClick,
  to,
  router,
  breakpoints: { isMobile },
  arrow = false,
  theme = 'default'
}) => {
  const location = router.getCurrentLocation()
  if (!onClick && !to) {
    to = location.pathname
      .split('/')
      .slice(0, -1)
      .join('/')
  }
  const arrowColor =
    theme === 'primary'
      ? getCssVariableValue('primaryContrastTextColor')
      : getCssVariableValue('coolGrey')
  const handleClick = (onClick = onClick || (() => to && router.push(to)))
  return isMobile ? (
    <BackButtonMobile onClick={handleClick} theme={theme} />
  ) : (
    arrow && (
      <a onClick={handleClick} className={styles['back-arrow']}>
        <Icon icon={arrowLeft} color={arrowColor} />
      </a>
    )
  )
}

BackButton.propTypes = {
  /** Location to go when clicking on the button. Uses react-router. */
  to: PropTypes.string,
  /** onClick handler. Mutually exclusive with `to` */
  onClick: PropTypes.func,
  /** Provided by `withRouter` in `withBackSwipe` */
  router: PropTypes.object,
  theme: PropTypes.oneOf(['primary', 'default'])
}

export default compose(
  withBreakpoints(),
  withBackSwipe({ getLocation: ownProps => ownProps.to })
)(BackButton)
