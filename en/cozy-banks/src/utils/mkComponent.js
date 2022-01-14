import React from 'react'

export default (Tag, extra = {}) =>
  // eslint-disable-next-line
  props =>
    <Tag {...extra} {...props} />
