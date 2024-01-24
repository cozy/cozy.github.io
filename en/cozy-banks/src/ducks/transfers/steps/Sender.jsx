import React from 'react'
import Padded from 'components/Padded'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/deprecated/Media'
import { translate } from 'cozy-ui/transpiled/react/providers/I18n'
import { List, Row } from 'components/List'
import PageTitle from 'components/Title/PageTitle'
import Figure from 'cozy-ui/transpiled/react/Figure'
import Typography from 'cozy-ui/transpiled/react/Typography'
import AccountIcon from 'components/AccountIcon'

import Title from 'ducks/transfers/steps/Title'

const SenderRow = ({ account, onSelect }) => {
  return (
    <Row
      className="u-c-pointer"
      onClick={onSelect.bind(null, account)}
      key={account._id}
    >
      <Media className="u-w-100">
        <Img className="u-mr-1">
          {/* TODO, remove key when AccountIcon correctly updates on account change (https://github.com/cozy/cozy-ui/issues/1076) */}
          <AccountIcon key={account._id} account={account} />
        </Img>
        <Bd>
          <Typography variant="body1">{account.shortLabel}</Typography>
          <Typography variant="caption" color="textSecondary">
            {account.iban}
          </Typography>
        </Bd>
        <Img className="u-ml-half">
          <Typography variant="h6">
            <Figure
              coloredWarning
              coloredNegative
              coloredPositive
              total={account.balance}
              symbol="€"
            />
          </Typography>
        </Img>
      </Media>
    </Row>
  )
}

class _ChooseSenderAccount extends React.Component {
  render() {
    const { accounts, onSelect, active, t } = this.props
    return (
      <Padded>
        {active && <PageTitle>{t('Transfer.sender.page-title')}</PageTitle>}
        <Title>{t('Transfer.sender.title')}</Title>
        <Padded.Unpadded horizontal>
          <List border="horizontal">
            {accounts.map(account => (
              <SenderRow
                key={account._id}
                account={account}
                onSelect={onSelect}
              />
            ))}
          </List>
        </Padded.Unpadded>
      </Padded>
    )
  }
}

const ChooseSenderAccount = React.memo(translate()(_ChooseSenderAccount))

export default ChooseSenderAccount
