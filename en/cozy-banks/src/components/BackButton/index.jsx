import React from 'react'
import PropTypes from 'prop-types'
import styles from 'components/BackButton/style.styl'
import withBackSwipe from 'utils/backSwipe'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import Icon from 'cozy-ui/transpiled/react/Icon'
import { useCozyTheme } from 'cozy-ui/transpiled/react/CozyTheme'
import arrowLeft from 'assets/icons/icon-arrow-left.svg'
import cx from 'classnames'
import { BarLeft } from 'components/Bar'

export const BackIcon = () => {
  const theme = useCozyTheme()
  return (
    <Icon
      className={cx(
        theme ? styles[`BackIcon--${theme}`] : null,
        styles.BackIcon
      )}
      icon={arrowLeft}
    />
  )
}

export const BackLink = ({ className, onClick }) => (
  <a className={cx(styles.BackArrow, className)} onClick={onClick}>
    <BackIcon />
  </a>
)

export const BackButton = ({ className, onClick }) => (
  <button className={cx(styles.BackArrow, className)} onClick={onClick}>
    <BackIcon />
  </button>
)

export const BarBackButton = ({ onClick }) => {
  const { isMobile } = useBreakpoints()
  return isMobile ? (
    <BarLeft>
      <BackButton
        className={cx(styles.BackArrow, 'coz-bar-btn coz-bar-burger')}
        onClick={onClick}
      />
    </BarLeft>
  ) : null
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
const MobileAwareBackButton = ({ onClick, to, router, arrow = false }) => {
  const { isMobile } = useBreakpoints()
  const location = router.getCurrentLocation()
  if (!onClick && !to) {
    to = location.pathname
      .split('/')
      .slice(0, -1)
      .join('/')
  }

  const handleClick = (onClick = onClick || (() => to && router.push(to)))
  return isMobile ? (
    <BarBackButton onClick={handleClick} />
  ) : (
    arrow && <BackLink onClick={handleClick} />
  )
}

MobileAwareBackButton.propTypes = {
  /** Location to go when clicking on the button. Uses react-router. */
  to: PropTypes.string,
  /** onClick handler. Mutually exclusive with `to` */
  onClick: PropTypes.func,
  /** Provided by `withRouter` in `withBackSwipe` */
  router: PropTypes.object
}

export default withBackSwipe({ getLocation: ownProps => ownProps.to })(
  MobileAwareBackButton
)
