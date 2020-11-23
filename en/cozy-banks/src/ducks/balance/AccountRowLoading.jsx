import React from 'react'
import PropTypes from 'prop-types'
import compose from 'lodash/flowRight'
import Icon from 'cozy-ui/transpiled/react/Icon'
import { translate } from 'cozy-ui/transpiled/react'
import KonnectorIcon from 'cozy-harvest-lib/dist/components/KonnectorIcon'
import styles from 'ducks/balance/AccountRow.styl'
import stylesLoading from 'ducks/balance/AccountRowLoading.styl'
import cx from 'classnames'
import { Intents } from 'cozy-interapp'
import { withClient } from 'cozy-client'

import WarningIcon from 'cozy-ui/transpiled/react/Icons/Warning'
import SpinnerIcon from 'cozy-ui/transpiled/react/Icons/Spinner'

export class AccountRowLoading extends React.PureComponent {
  intents = new Intents({ client: this.props.client })

  async redirect() {
    const { konnector, account } = this.props
    await this.intents.redirect('io.cozy.accounts', { konnector, account })
  }

  render() {
    const { t, konnectorSlug, status } = this.props
    const isErrored = status === 'errored'
    const liProps = isErrored ? { onClick: () => this.redirect() } : {}
    return (
      <li
        className={cx(styles.AccountRow, {
          [stylesLoading.pointer]: isErrored
        })}
        {...liProps}
      >
        <div className={styles.AccountRow__column}>
          <div className={styles.AccountRow__logo}>
            {konnectorSlug && (
              <KonnectorIcon
                konnectorSlug={konnectorSlug}
                className={styles.KonnectorIcon}
              />
            )}
          </div>
          <div className={styles.AccountRow__labelUpdatedAtWrapper}>
            <div className={styles.AccountRow__label}>
              {isErrored
                ? t('Balance.importing_accounts_error')
                : t('Balance.importing_accounts')}
            </div>
            <div className={styles.AccountRow__updatedAt}>
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
                    {t('Balance.in_progress')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </li>
    )
  }
}

AccountRowLoading.propTypes = {
  t: PropTypes.func.isRequired,
  konnectorSlug: PropTypes.string.isRequired,
  account: PropTypes.string,
  status: PropTypes.string.isRequired
}

export default compose(
  translate(),
  withClient
)(AccountRowLoading)
