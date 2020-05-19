import React, { useRef } from 'react'
import useToggle from 'components/useToggle'
import styles from './styles.styl'

const ActionMenuHelper = ({ opener, menu }) => {
  const [opened, openMenu, closeMenu] = useToggle(false)
  const openerRef = useRef()
  return (
    <div className="u-inline-flex">
      {React.cloneElement(opener, { onClick: openMenu, ref: openerRef })}
      {opened
        ? React.cloneElement(menu, {
            autoclose: true,
            onClose: closeMenu,
            placement: 'bottom-end',
            className: styles['ActionMenuHelper__menu']
          })
        : null}
    </div>
  )
}

export default ActionMenuHelper
