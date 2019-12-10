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
import cx from 'classnames'

const { BarLeft } = cozy.bar

export const BackIcon = ({ color }) => <Icon icon={arrowLeft} color={color} />

export const BackLink = ({ className, color, onClick }) => (
  <a className={cx(styles.BackLink, className)} onClick={onClick}>
    <BackIcon color={color} />
  </a>
)

export const BackButton = ({ className, color, onClick }) => (
  <button className={cx(styles.BackButton, className)} onClick={onClick}>
    <BackIcon color={color} />
  </button>
)

BackButton.defaultProps = {
  color: 'var(--coolGrey)'
}

export const BarBackButton = ({ onClick, color }) => (
  <BarLeft>
    <BackButton
      className="coz-bar-btn coz-bar-burger"
      color={color}
      onClick={onClick}
    />
  </BarLeft>
)

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
const MobileAwareBackButton = ({
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
    <BarBackButton onClick={handleClick} color={arrowColor} />
  ) : (
    arrow && <BackLink onClick={handleClick} color={arrowColor} />
  )
}

MobileAwareBackButton.propTypes = {
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
)(MobileAwareBackButton)
