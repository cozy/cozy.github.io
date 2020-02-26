import React from 'react'
import Icon from 'cozy-ui/transpiled/react/Icon'
import cx from 'classnames'
import healthCatIcon from 'assets/icons/categories/icon-cat-health.svg'
import styles from 'ducks/balance/components/ReimbursementsIcon.styl'
import { getCssVariableValue } from 'cozy-ui/transpiled/react/utils/color'
import CategoryIcon from 'ducks/categories/CategoryIcon'
import PropTypes from 'prop-types'

// For some categories (currently only health), we don't want to use the
// category icon. This maps category ids to custom icons. These icons will be
// used first if they exist, otherwise we fall back on the category icon, or
// "potentialTransfer" icon if there's no category id
const categoryIdToIcon = {
  '400610': healthCatIcon
}

export default function ReimbursementsIcon(props) {
  const { className, account, size } = props
  const icon = categoryIdToIcon[account.categoryId]

  return (
    <span className={cx(styles.ReimbursementsIcon, className)}>
      {icon ? (
        <Icon icon={icon} size={size} />
      ) : (
        <CategoryIcon categoryId={account.categoryId || '100'} size={size} />
      )}
      <span className={cx(styles.ReimbursementsIcon__hourglass)}>
        <Icon
          icon="hourglass"
          size={8}
          color={getCssVariableValue('coolGrey')}
        />
      </span>
    </span>
  )
}

ReimbursementsIcon.propTypes = {
  size: PropTypes.number
}

ReimbursementsIcon.defaultProps = {
  size: 24
}
