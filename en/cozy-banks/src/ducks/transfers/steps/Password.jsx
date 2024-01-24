import React from 'react'
import Padded from 'components/Padded'
import Field from 'cozy-ui/transpiled/react/Field'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Stack from 'cozy-ui/transpiled/react/Stack'

import PageTitle from 'components/Title/PageTitle'
import BottomButton from 'components/BottomButton'
import AccountIcon from 'components/AccountIcon'
import Title from 'ducks/transfers/steps/Title'

const _Password = ({
  onChangePassword,
  onConfirm,
  active,
  password,
  senderAccount
}) => {
  const { t } = useI18n()

  return (
    <>
      <Padded>
        {active && <PageTitle>{t('Transfer.password.page-title')}</PageTitle>}
        <Stack spacing="xs">
          <Title>{t('Transfer.password.title')}</Title>
          <div className="u-ta-center">
            {/* TODO, remove key when AccountIcon correctly updates on account change (https://github.com/cozy/cozy-ui/issues/1076) */}
            {senderAccount ? (
              <AccountIcon
                key={senderAccount._id}
                account={senderAccount}
                size="large"
              />
            ) : null}
          </div>
          <Field
            type="password"
            onChange={onChangePassword}
            value={password}
            placeholder={t('Transfer.password.field-placeholder')}
            label={t('Transfer.password.field-label')}
          />
        </Stack>
      </Padded>
      <BottomButton
        label={t('Transfer.password.confirm')}
        visible={active}
        onClick={onConfirm}
        disabled={password === ''}
      />
    </>
  )
}

export default React.memo(_Password)
