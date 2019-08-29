import React from 'react'
import PropTypes from 'prop-types'
import styles from 'ducks/categories/PendingCategoryIcon.styl'

const PendingCategoryIcon = ({ size = 32 }) => {
  const style = {
    width: size,
    height: size
  }

  // We don't externalize the SVG into its own file and use it in a cozy-ui
  // Icon because it breaks the SVG animations
  return (
    <span className={styles.PendingCategoryIcon} style={style}>
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        x="0px"
        y="0px"
        viewBox="0 0 100 100"
        enableBackground="new 0 0 0 0"
        xmlSpace="preserve"
      >
        <circle fill="#fff" stroke="none" cx="25" cy="50" r="6">
          <animate
            attributeName="opacity"
            dur="1s"
            values="0;1;0"
            repeatCount="indefinite"
            begin="0.1"
          />
        </circle>
        <circle fill="#fff" stroke="none" cx="50" cy="50" r="6">
          <animate
            attributeName="opacity"
            dur="1s"
            values="0;1;0"
            repeatCount="indefinite"
            begin="0.2"
          />
        </circle>
        <circle fill="#fff" stroke="none" cx="75" cy="50" r="6">
          <animate
            attributeName="opacity"
            dur="1s"
            values="0;1;0"
            repeatCount="indefinite"
            begin="0.3"
          />
        </circle>
      </svg>
    </span>
  )
}

PendingCategoryIcon.propTypes = {
  size: PropTypes.number
}

export default PendingCategoryIcon
