import React from 'react'
import Button from 'cozy-ui/transpiled/react/deprecated/Button'

import Bottom from 'components/Bottom'
import Padded from 'components/Padded'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

const buttonStyle = {
  transition: 'transform 0.5s ease'
}

const styles = {
  invisibleWrapper: {
    pointerEvents: 'none'
  },
  visibleButton: {
    ...buttonStyle,
    opacity: 1,
    transform: `translateY(0px)`
  },
  invisibleButton: {
    ...buttonStyle,
    opacity: 0,
    transform: `translateY(100px)`
  }
}

/** Button displayed at the bottom of the view on mobile, appears from the bottom */
const _BottomButtonMobile = ({ visible, ...buttonProps }) => (
  <Bottom style={!visible ? styles.invisibleWrapper : null}>
    <Padded>
      <Button
        extension="full"
        theme="primary"
        style={visible ? styles.visibleButton : styles.invisibleButton}
        {...buttonProps}
      />
    </Padded>
  </Bottom>
)

// eslint-disable-next-line no-unused-vars
const _BottomButtonDesktop = ({ visible, ...props }) => (
  <Button className="u-mh-0 u-db" theme="primary" {...props} />
)

const BottomButtonDesktop = React.memo(_BottomButtonDesktop)
const BottomButtonMobile = React.memo(_BottomButtonMobile)

BottomButtonMobile.defaultProps = {
  visible: true
}

const BottomButton = props => {
  const { isMobile } = useBreakpoints()
  return isMobile ? (
    <BottomButtonMobile {...props} />
  ) : (
    <BottomButtonDesktop {...props} />
  )
}

export default BottomButton
