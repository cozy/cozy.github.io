import React from 'react'
import PropTypes from 'prop-types'
import SwipeableViews from 'react-swipeable-views'

import PercentageLine from 'components/PercentageLine'
import { BackButtonMobile } from 'components/BackButton'
import styles from './styles.styl'

/**
 * Controlled component displaying a list of views like a carousel.
 *
 * - A progression bar is displayed at the top
 * - A back button is displayed when not on the first view.
 * - Every child gets an `active` prop
 */
class Stepper extends React.Component {
  render() {
    const { currentIndex, children, onBack } = this.props
    return (
      <>
        <div className={styles.ProgressBackground}>
          <PercentageLine
            color="var(--primaryColor)"
            className={styles.ProgressLine}
            value={Math.max(((currentIndex + 1) / children.length) * 100, 1)}
          />
        </div>
        {currentIndex > 0 ? <BackButtonMobile onClick={onBack} /> : null}
        <SwipeableViews animateHeight disabled index={currentIndex}>
          {React.Children.map(children, (child, i) => {
            return React.cloneElement(child, { active: i === currentIndex })
          })}
        </SwipeableViews>
      </>
    )
  }
}

Stepper.propTypes = {
  currentIndex: PropTypes.number.isRequired,
  onBack: PropTypes.func.isRequired
}

export default Stepper
