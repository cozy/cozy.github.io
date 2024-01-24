import React, { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import { BarSearch } from 'components/Bar'
import BarSearchInput from 'components/BarSearchInput'

/** On desktop, shows a search input that when clicked brings to the search page */
const AppSearchBar = () => {
  const { isMobile } = useBreakpoints()
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const handleClick = useCallback(() => {
    navigate('/search')
  }, [navigate])

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
