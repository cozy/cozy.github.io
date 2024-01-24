import React from 'react'
import Icon from 'cozy-ui/transpiled/react/Icon'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/deprecated/Media'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import InfoIcon from 'cozy-ui/transpiled/react/Icons/Info'

import Typography from 'cozy-ui/transpiled/react/Typography'

const PersonalInfoDescription = () => {
  const { t } = useI18n()
  return (
    <Media align="top">
      <Img>
        <Icon icon={InfoIcon} className="u-mr-1" />
      </Img>
      <Bd>
        <Typography variant="h5">{t('PersonalInfo.info.title')}</Typography>
        <Typography variant="body1">
          {t('PersonalInfo.info.description')}
        </Typography>
      </Bd>
    </Media>
  )
}

export default PersonalInfoDescription
