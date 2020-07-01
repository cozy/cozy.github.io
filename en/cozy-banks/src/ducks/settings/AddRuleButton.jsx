import React from 'react'
import styles from './Rules.styl'
import cx from 'classnames'
import Button from 'cozy-ui/transpiled/react/Button'

const AddRuleButton = ({ label, busy, onClick }) => (
  <Button
    className={cx('u-ml-1 u-mb-0', styles.AddRuleButton)}
    theme="subtle"
    icon="plus"
    size="small"
    label={label}
    busy={busy}
    onClick={onClick}
  />
)

export default AddRuleButton
