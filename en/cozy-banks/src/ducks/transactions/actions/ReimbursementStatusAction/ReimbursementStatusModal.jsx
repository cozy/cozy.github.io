import React, { memo } from 'react'
import cx from 'classnames'

import flag from 'cozy-flags'

import Icon from 'cozy-ui/transpiled/react/Icon'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'

import List from 'cozy-ui/transpiled/react/MuiCozyTheme/List'
import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'
import FormControlLabel from 'cozy-ui/transpiled/react/FormControlLabel'
import Radio from 'cozy-ui/transpiled/react/Radios'

import {
  useTrackPage,
  trackPage,
  replaceLastPart
} from 'ducks/tracking/browser'
import iconReimbursement from 'assets/icons/icon-reimbursement-detailed.svg'
import styles from 'ducks/transactions/actions/ReimbursementStatusAction/ReimbursementStatusModal.styl'
import { getReimbursementStatus, getLabel } from 'ducks/transactions/helpers'
import { isHealthExpense } from 'ducks/categories/helpers'
import ContactItem from 'ducks/transactions/actions/ReimbursementStatusAction/ContactItem'
import RawContentDialog from 'components/RawContentDialog'

const ReimbursementStatusModal = function ReimbursementStatusModal(props) {
  const { isMobile } = useBreakpoints()
  const { t } = useI18n()
  const { transaction, onChange, brands, onClose, ...rest } = props
  const choices = ['pending', 'reimbursed', 'no-reimbursement']
  const status = getReimbursementStatus(transaction)

  const showContacts =
    flag('reimbursements-contacts') && isHealthExpense(transaction)

  useTrackPage(lastTracked =>
    replaceLastPart(lastTracked, 'depense-remboursement')
  )

  const handleClose = () => {
    trackPage(lastTracked => replaceLastPart(lastTracked, 'depense'))
    onClose()
  }

  return (
    <RawContentDialog
      size="small"
      open={true}
      title={
        <div className="u-ta-center">
          <Icon icon={iconReimbursement} size={56} color="var(--slateGrey)" />
          <Typography variant="h4">
            {t('Transactions.actions.reimbursementStatus.modal.title')}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {getLabel(transaction)}
          </Typography>
        </div>
      }
      onClose={handleClose}
      content={
        <>
          <form>
            <List>
              {choices.map(choice => (
                <ListItem
                  divider
                  button
                  disableRipple
                  onClick={() => onChange(choice)}
                  key={choice}
                >
                  <ListItemIcon>
                    <FormControlLabel
                      value={choice}
                      control={
                        <Radio
                          key={choice}
                          name="reimbursementStatus"
                          checked={status === choice}
                          onChange={ev => onChange(ev.target.value)}
                          className="u-ml-1"
                        />
                      }
                    />
                  </ListItemIcon>
                  <ListItemText>
                    {t(`Transactions.reimbursementStatus.${choice}`)}
                  </ListItemText>
                </ListItem>
              ))}
            </List>
          </form>
          {showContacts ? (
            <div
              className={cx(
                styles.ReimbursementStatusModal__contact,
                'u-pt-2',
                {
                  'u-mt-auto': isMobile
                }
              )}
            >
              {brands
                .filter(
                  brand => brand.health && brand.hasTrigger && brand.contact
                )
                .map((brand, index) => (
                  <ContactItem
                    brand={brand}
                    key={brand.name}
                    // TODO use stack layout when https://github.com/cozy/cozy-banks/pull/1312 has been merged (see https://github.com/cozy/cozy-banks/pull/1312/commits/2bc1d75a25fe2c61f219579ac56407e356997105 more particularly)
                    className={cx({
                      'u-mt-1-half': index !== 0
                    })}
                  />
                ))}
            </div>
          ) : null}
        </>
      }
      {...rest}
    />
  )
}

export default memo(ReimbursementStatusModal)
