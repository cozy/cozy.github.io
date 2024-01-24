import React from 'react'
import Input from 'cozy-ui/transpiled/react/Input'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/deprecated/Media'
import InlineCard from 'cozy-ui/transpiled/react/deprecated/InlineCard'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import Padded from 'components/Padded'
import PageTitle from 'components/Title/PageTitle'
import OptionalInput from 'components/OptionalInput'
import BottomButton from 'components/BottomButton'
import AccountIcon from 'components/AccountIcon'

const _Summary = ({
  amount,
  senderAccount,
  beneficiary,
  onConfirm,
  active,
  selectSlide,
  onChangeLabel,
  label,
  onChangeDate,
  date
}) => {
  const { t } = useI18n()

  return amount && senderAccount && beneficiary ? (
    <Padded>
      {active && <PageTitle>{t('Transfer.summary.page-title')}</PageTitle>}
      <div>
        {t('Transfer.summary.send')}{' '}
        <InlineCard
          className="u-c-pointer u-mb-half"
          onClick={selectSlide.bind(null, 'amount')}
        >
          {amount}€
        </InlineCard>
        <br />
        {t('Transfer.summary.to')}{' '}
        <InlineCard
          className="u-c-pointer u-mb-half"
          onClick={selectSlide.bind(null, 'beneficiary')}
        >
          {beneficiary.label}
        </InlineCard>
        <br />
        {t('Transfer.summary.from')}{' '}
        <InlineCard
          className="u-c-pointer u-mb-half"
          onClick={selectSlide.bind(null, 'sender')}
        >
          {/* TODO, remove key when AccountIcon correctly updates on account change (https://github.com/cozy/cozy-ui/issues/1076) */}
          <AccountIcon
            key={senderAccount._id}
            size="small"
            account={senderAccount}
          />{' '}
          {senderAccount.label}
        </InlineCard>
        <br />
        {t('Transfer.summary.on')}{' '}
        <InlineCard className="u-c-pointer u-mb-half u-invisible-form-field">
          <Input type="date" value={date} onChange={onChangeDate} size="tiny" />
        </InlineCard>
        <br />
        <Media>
          <Img className="u-mr-half">{t('Transfer.summary.for')}</Img>
          <Bd>
            <OptionalInput
              className="u-mb-half"
              value={label}
              onChange={onChangeLabel}
              placeholder={t('Transfer.summary.for-placeholder')}
            />
          </Bd>
        </Media>
        <BottomButton
          label={t('Transfer.summary.confirm')}
          visible={active}
          onClick={onConfirm}
        />
      </div>
    </Padded>
  ) : null
}

const Summary = React.memo(_Summary)

export default Summary
