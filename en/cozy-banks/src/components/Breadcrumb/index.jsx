import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import styles from 'components/Breadcrumb/style.styl'
import arrowLeftIcon from 'assets/icons/icon-arrow-left.svg'
import { coolGrey } from 'cozy-ui/react/palette'
import Icon from 'cozy-ui/react/Icon'

const BreadcrumbSeparator = () => (
  <span className={styles.BreadcrumbSeparator}>/</span>
)

const BreadcrumbItem = ({
  name,
  onClick,
  isCurrent = false,
  tag = 'span',
  showSeparator = false
}) => {
  const Tag = tag
  return (
    <div
      className={cx(styles.BreadcrumbItem, {
        [styles['BreadcrumbItem--current']]: isCurrent
      })}
    >
      <Tag
        onClick={onClick}
        className={cx({
          'u-clickable': onClick
        })}
      >
        {name}
      </Tag>
      {showSeparator && <BreadcrumbSeparator />}
    </div>
  )
}

const itemPropTypes = {
  name: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  tag: PropTypes.element
}

BreadcrumbItem.propTypes = {
  ...itemPropTypes,
  isCurrent: PropTypes.bool,
  showSeparator: PropTypes.bool
}

const Breadcrumb = ({ items, className, color }) => {
  const previousItems = items.slice(0, -1)
  const [lastPreviousItem] = previousItems.slice(-1)
  const [currentItem] = items.slice(-1)

  return (
    <div className={cx(styles.Breadcrumb, className)}>
      {items.length > 1 && (
        <Icon
          icon={arrowLeftIcon}
          color={
            color === 'primary' ? 'var(--primaryContrastTextColor)' : coolGrey
          }
          className={cx(styles.Breadcrumb__previousButton, styles[color])}
          onClick={lastPreviousItem.onClick}
        />
      )}
      <div className={cx(styles.Breadcrumb__items, styles[color])}>
        <div className={styles.Breadcrumb__previousItems}>
          {previousItems.map(({ name, onClick, tag }, index) => (
            <BreadcrumbItem
              key={name}
              name={name}
              onClick={onClick}
              tag={tag}
              showSeparator={index < previousItems.length - 1}
            />
          ))}
        </div>
        <BreadcrumbItem
          name={currentItem.name}
          tag={currentItem.tag}
          isCurrent
        />
      </div>
    </div>
  )
}

Breadcrumb.propTypes = {
  className: PropTypes.string,
  color: PropTypes.oneOf(['default', 'primary']),
  items: PropTypes.arrayOf(PropTypes.shape(itemPropTypes))
}

export default Breadcrumb
