import React, { useCallback } from 'react'

import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'

import { useHistory, useLocation } from 'components/RouterContext'
import { BarSearch } from 'components/Bar'
import BarSearchInput from 'components/BarSearchInput'

/** On desktop, shows a search input that when clicked brings to the search page */
const AppSearchBar = () => {
  const { isMobile } = useBreakpoints()
  const { t } = useI18n()
  const history = useHistory()
  const location = useLocation()
  const handleClick = useCallback(() => {
    history.push('/search')
  }, [history])

  return isMobile || location.pathname === '/search' ? null : (
    <BarSearch>
      <BarSearchInput
        placeholder={t('Search.input-placeholder')}
        onClick={handleClick}
      />
    </BarSearch>
  )
}

export default AppSearchBar
