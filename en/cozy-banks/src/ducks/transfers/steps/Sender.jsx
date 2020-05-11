import React from 'react'
import Padded from 'components/Spacing/Padded'
import {
  Media,
  Bd,
  Img,
  translate,
  Text,
  Caption,
  Bold
} from 'cozy-ui/transpiled/react'
import { List, Row } from 'components/List'
import PageTitle from 'components/Title/PageTitle'
import Figure from 'cozy-ui/transpiled/react/Figure'
import AccountIcon from 'components/AccountIcon'

import Title from 'ducks/transfers/steps/Title'

const SenderRow = ({ account, onSelect }) => {
  return (
    <Row
      className="u-clickable"
      onClick={onSelect.bind(null, account)}
      key={account._id}
    >
      <Media className="u-w-100">
        <Img className="u-mr-1">
          {/* TODO, remove key when AccountIcon correctly updates on account change (https://github.com/cozy/cozy-ui/issues/1076) */}
          <AccountIcon key={account._id} account={account} />
        </Img>
        <Bd>
          <Text>{account.shortLabel}</Text>
          <Caption>{account.iban}</Caption>
        </Bd>
        <Img className="u-ml-half">
          <Bold>
            <Figure
              coloredWarning
              coloredNegative
              coloredPositive
              total={account.balance}
              symbol="€"
            />
          </Bold>
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
