import React from 'react'
import StoreLink from 'components/StoreLink'

const AddAccountLink = props => {
  return (
    <StoreLink type="konnector" category="banking">
      {props.children}
    </StoreLink>
  )
}

export default AddAccountLink
