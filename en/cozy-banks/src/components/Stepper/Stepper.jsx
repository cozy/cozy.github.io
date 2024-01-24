import React from 'react'
import PropTypes from 'prop-types'
import SwipeableViews from 'react-swipeable-views'

import PercentageLine from 'components/PercentageLine'
import MobileAwareBackButton from 'components/BackButton'
import styles from './styles.styl'
import CozyTheme from 'cozy-ui/transpiled/react/providers/CozyTheme'

const StepperProgress = ({ currentIndex, steps }) => (
  <div className={styles.ProgressBackground}>
    <PercentageLine
      color="var(--primaryColor)"
      className={styles.ProgressLine}
      value={Math.max(((currentIndex + 1) / steps.length) * 100, 1)}
    />
  </div>
)

/**
 * Controlled component displaying a list of views like a carousel.
 *
 * - A progression bar is displayed at the top
 * - A back button is displayed when not on the first view.
 * - Every child gets an `active` prop
 */
const Stepper = ({ currentIndex, children, onBack, showPercentage }) => (
  <>
    {showPercentage ? (
      <StepperProgress steps={children} currentIndex={currentIndex} />
    ) : null}
    <CozyTheme variant="inverted">
      {currentIndex > 0 ? <MobileAwareBackButton onClick={onBack} /> : null}
    </CozyTheme>
    <SwipeableViews animateHeight disabled index={currentIndex}>
      {React.Children.map(children, (child, i) => {
        return React.cloneElement(child, { active: i === currentIndex })
      })}
    </SwipeableViews>
  </>
)

Stepper.propTypes = {
  currentIndex: PropTypes.number.isRequired,
  onBack: PropTypes.func.isRequired,
  /** Whether to show the percentage line showing how far we are in the stepper */
  showPercentage: PropTypes.bool
}

Stepper.defaultProps = {
  showPercentage: true
}

export default Stepper
