import React from 'react'

const Elevated = ({ elevation, radius, children, className, ...rest }) => {
  return (
    <div
      className={`${
        className || ''
      } u-c-pointer u-elevation-${elevation} u-bdrs-${radius}`}
      {...rest}
    >
      {children}
    </div>
  )
}

Elevated.defaultProps = {
  elevation: 1,
  radius: 4
}

export default Elevated
