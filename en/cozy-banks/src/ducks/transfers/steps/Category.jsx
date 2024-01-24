import React from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import FormControlLabel from 'cozy-ui/transpiled/react/FormControlLabel'
import Radio from 'cozy-ui/transpiled/react/Radios'

import Padded from 'components/Padded'
import { List, Row } from 'components/List'
import PageTitle from 'components/Title/PageTitle'
import Title from './Title'

const ChooseRecipientCategory = ({ category, onSelect, active }) => {
  const { t } = useI18n()
  return (
    <Padded>
      {active && <PageTitle>{t('Transfer.category.page-title')}</PageTitle>}
      <Title>{t('Transfer.category.title')}</Title>
      <Padded.Unpadded horizontal>
        <List border="horizontal">
          <Row onClick={onSelect.bind(null, 'internal')}>
            <FormControlLabel
              label={t('Transfer.category.internal')}
              value="internal"
              control={
                <Radio
                  readOnly
                  name="category"
                  checked={category == 'internal'}
                />
              }
            />
          </Row>
          <Row onClick={onSelect.bind(null, 'external')}>
            <FormControlLabel
              label={t('Transfer.category.external')}
              value="external"
              control={
                <Radio
                  readOnly
                  name="category"
                  checked={category == 'external'}
                />
              }
            />
          </Row>
        </List>
      </Padded.Unpadded>
    </Padded>
  )
}

export default React.memo(ChooseRecipientCategory)
