import React from 'react'
import { PersonalInfoGate } from 'ducks/personal-info'
import flag from 'cozy-flags'
import Padded from 'components/Padded'
import Empty from 'cozy-ui/transpiled/react/Empty'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import ForbiddenSign from 'cozy-ui/transpiled/react/Icons/ForbiddenSign'

/**
 * Verifies transfer preconditions before rendering children
 *
 * - Checks for personal info via PersonalInfoGate
 * - Checks flags to see if transfers were blocked on an instance via Bender
 */
const TransferGate = ({ children }) => {
  const { t } = useI18n()
  if (flag('banks.transfers.forbidden')) {
    return (
      <Padded className="u-stack-s u-ta-center">
        <Empty
          icon={ForbiddenSign}
          title={t('Transfer.user-blocked.title')}
          text={t('Transfer.user-blocked.description')}
        />
      </Padded>
    )
  }
  return <PersonalInfoGate>{children}</PersonalInfoGate>
}

export default TransferGate
