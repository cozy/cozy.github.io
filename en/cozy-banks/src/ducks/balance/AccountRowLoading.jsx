import React from 'react'
import PropTypes from 'prop-types'
import compose from 'lodash/flowRight'
import Icon from 'cozy-ui/transpiled/react/Icon'
import { translate } from 'cozy-ui/transpiled/react/providers/I18n'
import KonnectorIcon from 'cozy-harvest-lib/dist/components/KonnectorIcon'
import styles from 'ducks/balance/AccountRow.styl'
import stylesLoading from 'ducks/balance/AccountRowLoading.styl'
import { Intents } from 'cozy-interapp'
import { withClient } from 'cozy-client'

import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'

import WarningIcon from 'cozy-ui/transpiled/react/Icons/Warning'
import SpinnerIcon from 'cozy-ui/transpiled/react/Icons/Spinner'

const listItemIconStyle = { height: 32 }

export class AccountRowLoading extends React.PureComponent {
  intents = new Intents({ client: this.props.client })

  constructor(props, context) {
    super(props, context)
    this.redirect = this.redirect.bind(this)
  }

  async redirect() {
    const { konnector, account } = this.props
    await this.intents.redirect('io.cozy.accounts', { konnector, account })
  }

  render() {
    const { t, konnectorSlug, status } = this.props
    const isErrored = status === 'errored'
    return (
      <ListItem
        className={styles.AccountRow}
        button={isErrored}
        onClick={isErrored ? this.redirect : null}
      >
        <ListItemIcon style={listItemIconStyle}>
          {konnectorSlug && (
            <KonnectorIcon
              konnector={{ slug: konnectorSlug }}
              className={styles.KonnectorIcon}
            />
          )}
        </ListItemIcon>
        <ListItemText disableTypography>
          <Typography variant="body1">
            {isErrored
              ? t('Balance.importing-accounts-error')
              : t('Balance.import-accounts')}
          </Typography>
          <Typography variant="caption">
            {isErrored ? (
              <>
                <Icon size="12" icon={WarningIcon} />
                <span className={stylesLoading.error}>
                  {t('Balance.error')}
                </span>
              </>
            ) : (
              <>
                <Icon
                  size="12"
                  icon={SpinnerIcon}
                  color="var(--primaryColor)"
                  spin
                />
                <span className={stylesLoading.InProgress}>
                  {t('Balance.in-progress')}
                </span>
              </>
            )}
          </Typography>
        </ListItemText>
      </ListItem>
    )
  }
}

AccountRowLoading.propTypes = {
  t: PropTypes.func.isRequired,
  konnectorSlug: PropTypes.string.isRequired,
  account: PropTypes.string,
  status: PropTypes.string.isRequired
}

export default compose(translate(), withClient)(AccountRowLoading)
