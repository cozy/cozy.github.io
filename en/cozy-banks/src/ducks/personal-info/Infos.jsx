import React from 'react'
import Icon from 'cozy-ui/transpiled/react/Icon'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/Media'
import { Text, SubTitle } from 'cozy-ui/transpiled/react/Text'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'

import InfoIcon from 'cozy-ui/transpiled/react/Icons/Info'

const PersonalInfoDescription = () => {
  const { t } = useI18n()
  return (
    <Media align="top">
      <Img>
        <Icon icon={InfoIcon} className="u-mr-1" />
      </Img>
      <Bd>
        <SubTitle>{t('PersonalInfo.info.title')}</SubTitle>
        <Text>{t('PersonalInfo.info.description')}</Text>
      </Bd>
    </Media>
  )
}

export default PersonalInfoDescription
