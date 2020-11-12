import React from 'react'
import styles from './Rules.styl'
import cx from 'classnames'
import Button from 'cozy-ui/transpiled/react/Button'

import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import Icon from 'cozy-ui/transpiled/react/Icon'

const AddRuleButton = ({ label, busy, onClick }) => (
  <Button
    className={cx('u-ml-1 u-mb-0', styles.AddRuleButton)}
    theme="subtle"
    icon={<Icon icon={PlusIcon} />}
    size="small"
    label={label}
    busy={busy}
    onClick={onClick}
  />
)

export default AddRuleButton
