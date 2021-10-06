import React from 'react'

import { getLabel } from 'ducks/transactions'

import Icon from 'cozy-ui/transpiled/react/Icon'
import MagnifierIcon from 'cozy-ui/transpiled/react/Icons/Magnifier'

const SearchForTransactionIcon = ({ transaction }) => {
  const label = getLabel(transaction)
  return (
    <a href={`#/search/${encodeURIComponent(label)}`}>
      <Icon className="u-ml-half u-coolGrey" icon={MagnifierIcon} />
    </a>
  )
}

export default React.memo(SearchForTransactionIcon)
