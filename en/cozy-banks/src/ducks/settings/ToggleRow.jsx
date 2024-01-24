import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import styles from 'ducks/settings/ToggleRow.styl'
import Switch from 'cozy-ui/transpiled/react/Switch'
import Typography from 'cozy-ui/transpiled/react/Typography'

export const ToggleRowContent = props => {
  const { className, ...rest } = props

  return <div className={cx(styles.ToggleRow__body, className)} {...rest} />
}

export const ToggleRowDescription = props => {
  const { className, ...rest } = props

  return (
    <Typography
      variant="body2"
      color="textSecondary"
      className={cx(styles.ToggleRow__description, className)}
      {...rest}
    />
  )
}

const ToggleRow = ({ enabled, description, onToggle }) => {
  return (
    <ToggleRowContent>
      <ToggleRowDescription>
        <span dangerouslySetInnerHTML={{ __html: description }} />
      </ToggleRowDescription>

      <Switch
        disableRipple
        className="u-mh-half"
        checked={enabled}
        color="primary"
        onClick={e => e.stopPropagation()}
        onChange={() => onToggle(!enabled)}
        aria-label={description}
      />
    </ToggleRowContent>
  )
}

ToggleRow.propTypes = {
  enabled: PropTypes.bool.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  title: PropTypes.string,
  description: PropTypes.string.isRequired,
  onChangeValue: PropTypes.func,
  name: PropTypes.string.isRequired,
  onToggle: PropTypes.func.isRequired,
  unit: PropTypes.string
}

export default ToggleRow
