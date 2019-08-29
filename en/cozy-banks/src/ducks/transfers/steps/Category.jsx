import React from 'react'
import Padded from 'components/Spacing/Padded'
import { translate } from 'cozy-ui/transpiled/react'
import { List, Row, Radio } from 'components/List'
import PageTitle from 'components/Title/PageTitle'
import Title from './Title'

const ChooseRecipientCategory = ({ t, category, onSelect, active }) => {
  return (
    <Padded>
      {active && <PageTitle>{t('Transfer.category.page-title')}</PageTitle>}
      <Title>{t('Transfer.category.title')}</Title>
      <Padded.Unpadded horizontal>
        <List border="horizontal">
          <Row onClick={onSelect.bind(null, 'internal')}>
            <Radio
              readOnly
              name="category"
              checked={category == 'internal'}
              value="internal"
              label={t('Transfer.category.internal')}
            />
          </Row>
          <Row onClick={onSelect.bind(null, 'external')}>
            <Radio
              readOnly
              name="category"
              checked={category == 'external'}
              value="external"
              label={t('Transfer.category.external')}
            />
          </Row>
        </List>
      </Padded.Unpadded>
    </Padded>
  )
}

export default React.memo(translate()(ChooseRecipientCategory))
