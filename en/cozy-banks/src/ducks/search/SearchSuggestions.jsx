import React from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Typography from 'cozy-ui/transpiled/react/Typography'

const SearchSuggestions = () => {
  const { t } = useI18n()

  return (
    <Typography align="center" variant="body1">
      {t('Search.suggestions')}
    </Typography>
  )
}

export default React.memo(SearchSuggestions)
