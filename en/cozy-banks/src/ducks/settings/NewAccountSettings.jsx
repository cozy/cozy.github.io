import { flowRight as compose, set } from 'lodash'
import React, { useState } from 'react'
import { connect } from 'react-redux'
import MenuItem from '@material-ui/core/MenuItem'

import { Query, withClient } from 'cozy-client'
import Alerter from 'cozy-ui/transpiled/react/Alerter'
import Button from 'cozy-ui/transpiled/react/Button'
import Menu from 'cozy-ui/transpiled/react/MuiCozyTheme/Menus'
import { useI18n, useBreakpoints } from 'cozy-ui/transpiled/react'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import Field from 'cozy-ui/transpiled/react/Field'
import CollectionField from 'cozy-ui/transpiled/react/Labs/CollectionField'
import Stack from 'cozy-ui/transpiled/react/Stack'
import BaseContactPicker from 'cozy-ui/transpiled/react/ContactPicker'
import CozyTheme from 'cozy-ui/transpiled/react/CozyTheme'
import Modal from 'cozy-ui/transpiled/react/Modal'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/Media'

import BarTheme from 'ducks/bar/BarTheme'
import { ACCOUNT_DOCTYPE } from 'doctypes'
import {
  getAccountLabel,
  getAccountInstitutionLabel,
  getAccountType,
  getAccountOwners
} from 'ducks/account/helpers'
import NarrowContent from 'cozy-ui/transpiled/react/NarrowContent'
import cx from 'classnames'
import styles from 'ducks/settings/NewAccountSettings.styl'
import { getHomeURL } from 'ducks/apps/selectors'

import { Padded } from 'components/Spacing'
import { PageTitle } from 'components/Title'
import BackButton from 'components/BackButton'
import Loading from 'components/Loading'
import withFilters from 'components/withFilters'
import { BarRight } from 'components/Bar'

const ContactPicker = props => {
  const { t } = useI18n()
  // eslint-disable-next-line no-unused-vars
  const { ...rest } = props

  return (
    <BaseContactPicker
      listPlaceholder={t('AccountSettings.listPlaceholder')}
      listEmptyMessage={t('AccountSettings.listEmptyMessage')}
      addContactLabel={t('AccountSettings.addContactLabel')}
      {...props}
    />
  )
}

const AccountSettingsForm = props => {
  const { isMobile } = useBreakpoints()
  const { t } = useI18n()
  const { account, onSubmit, onCancel, ...rest } = props

  const [shortLabel, setShortLabel] = useState(getAccountLabel(account))
  const [owners, setOwners] = useState(getAccountOwners(account))

  const handleSubmit = e => {
    e.preventDefault()
    onSubmit({ shortLabel, owners })
  }

  const fieldVariant = isMobile ? 'default' : 'inline'

  return (
    <form onSubmit={handleSubmit} {...rest}>
      <Stack spacing={isMobile ? 's' : 'm'}>
        <Field
          id="account-label"
          label={t('AccountSettings.label')}
          value={shortLabel}
          onChange={e => setShortLabel(e.target.value)}
          variant={fieldVariant}
          className={styles.Form__field}
        />
        <CollectionField
          label={t('AccountSettings.owner')}
          values={owners}
          component={ContactPicker}
          addButtonLabel={t('AccountSettings.addOwnerBtn')}
          removeButtonLabel={t('AccountSettings.removeOwnerBtn')}
          variant={fieldVariant}
          onChange={owners => setOwners(owners)}
          placeholder={t('AccountSettings.ownerPlaceholder')}
        />
        <Field
          id="account-institution"
          label={t('AccountSettings.bank')}
          value={getAccountInstitutionLabel(account)}
          disabled
          variant={fieldVariant}
          className={styles.Form__field}
        />
        <Field
          id="account-number"
          label={t('AccountSettings.number')}
          value={account.number}
          disabled
          variant={fieldVariant}
          className={styles.Form__field}
        />
        <Field
          id="account-type"
          label={t('AccountSettings.type')}
          value={getAccountType(account)}
          disabled
          variant={fieldVariant}
          className={styles.Form__field}
        />
      </Stack>
      <FormControls onCancel={onCancel} t={t} />
    </form>
  )
}

const FormControls = props => {
  const { t } = useI18n()
  const { onCancel, form, className, ...rest } = props

  return (
    <div className={cx(styles.FormControls, className)} {...rest}>
      <Button
        label={t('General.cancel')}
        theme="secondary"
        onClick={onCancel}
      />
      <Button
        type="submit"
        form={form}
        label={t('AccountSettings.apply')}
        theme="primary"
      />
    </div>
  )
}

const DeleteConfirm = ({
  cancel,
  confirm,
  title,
  description,
  secondaryText,
  primaryText
}) => {
  return (
    <Modal
      title={title}
      description={<div dangerouslySetInnerHTML={{ __html: description }} />}
      secondaryType="secondary"
      secondaryText={secondaryText}
      secondaryAction={cancel}
      dismissAction={cancel}
      primaryType="danger"
      primaryText={primaryText}
      primaryAction={confirm}
    />
  )
}

const saveAccount = async params => {
  const { client, account, fields, onSuccess, onError } = params

  Object.keys(fields).forEach(key => {
    if (key === 'owners') {
      set(
        account,
        'relationships.owners.data',
        fields[key].map(owner => ({
          _id: owner._id,
          _type: owner._type
        }))
      )
      return
    }

    account[key] = fields[key]
  })

  try {
    await client.save(account)
    onSuccess()
  } catch (err) {
    onError(err)
  }
}

const NewAccountSettings = props => {
  const { t } = useI18n()
  const {
    breakpoints: { isMobile },
    routeParams,
    router,
    client,
    homeUrl,
    filteringDoc,
    resetFilterByDoc
  } = props

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSaveAccount = async (account, fields) => {
    await saveAccount({
      client,
      account,
      fields,
      onSuccess: () => {
        router.push('/settings/accounts')
        Alerter.success(t('AccountSettings.success'))
      },
      onError: err => {
        // eslint-disable-next-line no-console
        console.error(err)
        Alerter.error(t('AccountSettings.failure'))
      }
    })
  }

  const handleRemoveAccount = async account => {
    setDeleting(true)

    try {
      await client.destroy(account)

      if (filteringDoc && account._id === filteringDoc._id) {
        resetFilterByDoc()
      }

      router.push('/settings/accounts')
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
      Alerter.error(t('AccountSettings.deletion_error'))
    } finally {
      setDeleting(false)
    }
  }

  const confirmPrimaryText = t('AccountSettings.confirm-deletion.description')
    .replace('#{LINK}', homeUrl ? `<a href="${homeUrl}" target="_blank">` : '')
    .replace('#{/LINK}', homeUrl ? '</a>' : '')
    .replace('#{APP_NAME}', name)

  return (
    <>
      <BarTheme theme="primary" />
      <Query
        query={client =>
          client.get(ACCOUNT_DOCTYPE, routeParams.accountId).include(['owners'])
        }
      >
        {({ data, fetchStatus }) => {
          if (fetchStatus === 'loading') {
            return <Loading />
          }

          if (!data) {
            return null
          }

          const account = data

          return (
            <Padded
              className={cx({
                'u-pt-2': !isMobile
              })}
            >
              {isMobile && (
                <>
                  <CozyTheme theme="primary">
                    <BackButton to="/settings/accounts" arrow theme="primary" />
                  </CozyTheme>
                  <BarRight>
                    <Menu
                      position="right"
                      component={
                        <Button
                          icon="dots"
                          iconOnly
                          label="click"
                          theme="secondary"
                          extension="narrow"
                          className={styles.Menu__btn}
                        />
                      }
                    >
                      <MenuItem onClick={() => setShowDeleteConfirmation(true)}>
                        {t('AccountSettings.removeAccountBtn')}
                      </MenuItem>
                    </Menu>
                  </BarRight>
                </>
              )}
              <Media className="u-maw-7">
                {!isMobile && (
                  <Img>
                    <BackButton to="/settings/accounts" arrow />
                  </Img>
                )}
                <Bd>
                  <PageTitle>{getAccountLabel(account)}</PageTitle>
                </Bd>
                {!isMobile && (
                  <Img>
                    <Button
                      className="u-mr-0 u-ml-auto"
                      label={t('AccountSettings.removeAccountBtn')}
                      theme="danger-outline"
                      onClick={() => setShowDeleteConfirmation(true)}
                    />
                  </Img>
                )}
              </Media>
              <NarrowContent className={cx({ 'u-mt-2': !isMobile })}>
                <AccountSettingsForm
                  account={account}
                  id="account-settings-form"
                  onSubmit={fields => handleSaveAccount(account, fields)}
                  onCancel={() => router.push('/settings/accounts')}
                />
                {showDeleteConfirmation ? (
                  <DeleteConfirm
                    title={t('AccountSettings.confirm-deletion.title')}
                    description={confirmPrimaryText}
                    primaryText={
                      deleting ? (
                        <Spinner color="white" />
                      ) : (
                        t('AccountSettings.confirm-deletion.confirm')
                      )
                    }
                    secondaryText={t('General.cancel')}
                    confirm={() => handleRemoveAccount(account)}
                    cancel={() => setShowDeleteConfirmation(false)}
                  />
                ) : null}
              </NarrowContent>
            </Padded>
          )
        }}
      </Query>
    </>
  )
}

const mapStateToProps = state => ({
  homeUrl: getHomeURL(state)
})

export default compose(
  withClient,
  connect(mapStateToProps),
  withFilters
)(NewAccountSettings)
