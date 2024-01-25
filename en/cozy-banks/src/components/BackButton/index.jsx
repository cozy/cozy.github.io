import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import styles from 'components/BackButton/style.styl'
import BackSwipe from 'utils/backSwipe'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import Icon from 'cozy-ui/transpiled/react/Icon'
import { useCozyTheme } from 'cozy-ui/transpiled/react/providers/CozyTheme'
import arrowLeft from 'assets/icons/icon-arrow-left.svg'
import cx from 'classnames'
import { BarLeft } from 'components/Bar'

export const BackIcon = () => {
  const { variant } = useCozyTheme()
  return (
    <Icon
      className={cx(
        variant ? styles[`BackIcon--${variant}`] : null,
        styles.BackIcon
      )}
      icon={arrowLeft}
    />
  )
}

export const BackButton = ({ className, onClick, ...props }) => (
  <IconButton
    className={cx(styles.BackArrow, className)}
    size="medium"
    onClick={onClick}
    {...props}
  >
    <BackIcon />
  </IconButton>
)

export const BarBackButton = ({ onClick }) => {
  const { isMobile } = useBreakpoints()
  return isMobile ? (
    <BarLeft>
      <div className="u-pl-half">
        <BackButton onClick={onClick} />
      </div>
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
const MobileAwareBackButton = ({ onClick, to, arrow = false }) => {
  const { isMobile } = useBreakpoints()
  const location = useLocation()
  const navigate = useNavigate()
  let toToUse = to
  if (!onClick && !toToUse) {
    toToUse = location.pathname.split('/').slice(0, -1).join('/')
  }

  const handleClick = onClick ? onClick : () => toToUse && navigate(toToUse)
  return isMobile ? (
    <BarBackButton onClick={handleClick} />
  ) : (
    arrow && <BackButton onClick={handleClick} />
  )
}

MobileAwareBackButton.propTypes = {
  /** Location to go when clicking on the button. Uses react-router-dom. */
  to: PropTypes.string,
  /** onClick handler. Mutually exclusive with `to` */
  onClick: PropTypes.func
}

const MobileAwareBackButtonWrapper = ({ to, onClick }) => {
  return (
    <BackSwipe getLocation={ownProps => ownProps.to}>
      <MobileAwareBackButton to={to} onClick={onClick} />
    </BackSwipe>
  )
}

export default MobileAwareBackButtonWrapper
