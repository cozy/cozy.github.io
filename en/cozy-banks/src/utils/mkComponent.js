import React from 'react'

// eslint-disable-next-line react/display-name
export default (Tag, extra = {}) => props => <Tag {...extra} {...props} />
