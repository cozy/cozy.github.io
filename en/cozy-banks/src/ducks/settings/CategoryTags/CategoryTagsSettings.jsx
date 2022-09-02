import React from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Button from 'cozy-ui/transpiled/react/Buttons'

import { SubSection } from 'ducks/settings/Sections'
import { useHistory } from 'components/RouterContext'

const CategoryTagsSettings = () => {
  const { t } = useI18n()
  const history = useHistory()

  return (
    <SubSection
      title={t('Settings.budget-by-tags.pane-title')}
      description={t('Settings.budget-by-tags.pane-description')}
    >
      <Button
        label={t('Settings.budget-by-tags.button')}
        className="u-mv-half u-w-100"
        onClick={() => history.push('/settings/tags')}
      />
    </SubSection>
  )
}

export default CategoryTagsSettings
