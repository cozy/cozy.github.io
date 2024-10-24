import React from 'react'
import { useNavigate } from 'react-router-dom'
import flag from 'cozy-flags'
import cx from 'classnames'

import { getFlagshipMetadata } from 'cozy-device-helper'
import { useCozyTheme } from 'cozy-ui/transpiled/react/providers/CozyTheme'
import SearchBar from 'cozy-ui/transpiled/react/SearchBar'
import Icon from 'cozy-ui/transpiled/react/Icon'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import AssistantIcon from 'assets/images/icon-assistant.png'
import { FLAG_FAB_BUTTON_ENABLED } from 'components/AddButton/helpers'

import styles from './styles.styl'

export const AssistantWrapperMobile = () => {
  const { type } = useCozyTheme()
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <div
      className={cx(
        styles['assistantWrapper-mobile'],
        styles[`assistantWrapper-mobile--${type}`],
        {
          [styles['assistantWrapper-mobile--offset']]: flag(
            FLAG_FAB_BUTTON_ENABLED
          ),
          [styles['assistantWrapper-mobile--immersive']]:
            getFlagshipMetadata().immersive
        }
      )}
    >
      <SearchBar
        size="medium"
        icon={
          <Icon className="u-ml-1 u-mr-half" icon={AssistantIcon} size={24} />
        }
        type="button"
        label={t('assistant.search.placeholder')}
        onClick={() => navigate('connected/search')}
      />
    </div>
  )
}

export default AssistantWrapperMobile
