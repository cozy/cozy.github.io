import React from 'react'
import compose from 'lodash/flowRight'
import omit from 'lodash/omit'
import merge from 'lodash/merge'

import { translate } from 'cozy-ui/transpiled/react/providers/I18n'
import { withClient } from 'cozy-client'
import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'
import Button from 'cozy-ui/transpiled/react/deprecated/Button'
import Field from 'cozy-ui/transpiled/react/Field'
import Stack from 'cozy-ui/transpiled/react/Stack'
import { Dialog } from 'cozy-ui/transpiled/react/CozyDialogs'

import PersonalInfoInfos from 'ducks/personal-info/Infos'
import { trackPage, trackEvent } from 'ducks/tracking/browser'
import Loading from 'components/Loading'
import countries from './nationalities.json'
import {
  getDefaultIdentitySelector,
  saveIdentity,
  loadIdentities,
  isCurrentAppIdentity
} from 'ducks/personal-info/utils'
import Typography from 'cozy-ui/transpiled/react/Typography'
import withBankingSlugs from 'hoc/withBankingSlugs'

const defaultNationality = { label: 'Française', value: 'FR' }

const makeNationalitiesOptions = lang =>
  countries
    .map(country => {
      return {
        label: country[`${lang}_nationality`] || country['en_nationality'],
        value: country.alpha_2_code
      }
    })
    .sort((a, b) => a.label > b.label)

/**
 * Loads the myself contact and displays the form
 */
export class PersonalInfoDialog extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.handleChangeField = this.handleChangeField.bind(this)
    this.handleSave = this.handleSave.bind(this)

    this.state = {
      saving: false,
      formData: {
        birthcity: '',
        birthcountry: '',
        nationality: defaultNationality
      },
      identity: null
    }
    this.nationalityOptions = makeNationalitiesOptions(props.lang)
  }

  componentDidMount() {
    trackPage('virements:informations')
    this.loadIdentityAndFillForm()
  }

  /**
   * Loads all identities specified in the sourceIdentitySelectors prop
   * and fills the form's nationality and birthcity
   */
  async loadIdentityAndFillForm() {
    const { client, sourceIdentitySelectors: sourceIdentitySelectors_ } =
      this.props
    if (this.state.identity) {
      return
    }

    let identity, mergedIdentity
    try {
      const sourceIdentitySelectors = sourceIdentitySelectors_.map(fn =>
        typeof fn === 'function' ? fn(client) : fn
      )
      const identities = await loadIdentities(client, sourceIdentitySelectors)
      identity = identities.find(isCurrentAppIdentity(client)) || {}
      mergedIdentity = omit(merge({}, ...identities), ['_id', '_rev']) || {}
    } catch (e) {
      // New identity
      identity = {}
      mergedIdentity = {}
    }

    const {
      birthcity = '',
      birthcountry = '',
      nationalities
    } = mergedIdentity.contact || {}
    const nationality = nationalities ? { value: nationalities[0] } : null
    this.setState({
      identity,
      formData: {
        birthcity,
        birthcountry,
        nationality:
          this.nationalityOptions.find(
            x => x.value === (nationality && nationality.value)
          ) || defaultNationality
      }
    })
  }

  /** Keeps state.formData up-to-date */
  handleChangeField(name, value) {
    const formData = {
      ...this.state.formData,
      [name]: value
    }
    this.setState({
      formData
    })
  }

  /**
   * Validates form and saves identity
   */
  async handleSave(ev) {
    const { client, onSaveSuccessful, t } = this.props
    const { formData, identity } = this.state
    ev && ev.preventDefault()

    if (
      !formData.birthcity ||
      !formData.birthcountry ||
      !formData.nationality
    ) {
      this.setState({ validationError: true })
      return
    } else {
      this.setState({ validationError: false })
    }

    this.setState({ saving: true })
    try {
      const updatedIdentity = await saveIdentity(client, identity, {
        birthcity: formData.birthcity,
        birthcountry: formData.birthcountry,
        nationalities: [formData.nationality.value]
      })
      onSaveSuccessful && onSaveSuccessful(updatedIdentity)
      Alerter.success(t('PersonalInfo.info-saved-successfully'))
      trackEvent('sauver')
    } finally {
      this.setState({ saving: false })
    }
  }

  render() {
    const { t, onClose } = this.props
    const { saving, formData, validationError } = this.state

    if (!this.state.identity) {
      return (
        <Dialog
          open={true}
          onClose={onClose}
          title={t('PersonalInfo.modal-title')}
          content={<Loading />}
        />
      )
    }

    return (
      <Dialog
        open={true}
        onClose={onClose}
        title={t('PersonalInfo.modal-title')}
        content={
          <Stack spacing="xl">
            <Stack spacing="s">
              {validationError ? (
                <Typography variant="body1" className="u-mb-1 u-error">
                  {t('PersonalInfo.validation-error')}
                </Typography>
              ) : null}
              <Field
                value={formData.birthcity}
                onChange={ev =>
                  this.handleChangeField('birthcity', ev.target.value)
                }
                type="text"
                name="birthcity"
                label={t('PersonalInfo.birthcity')}
                placeholder={t('PersonalInfo.birthcity-placeholder')}
                className="u-mh-0 u-mb-0 u-mt-0"
              />
              <Field
                value={formData.birthcountry}
                onChange={ev =>
                  this.handleChangeField('birthcountry', ev.target.value)
                }
                type="text"
                name="birthcountry"
                label={t('PersonalInfo.birthcountry')}
                placeholder={t('PersonalInfo.birthcountry-placeholder')}
                className="u-mh-0 u-mb-0 u-mt-0"
              />
              <Field
                onChange={option =>
                  this.handleChangeField('nationality', option)
                }
                value={formData.nationality}
                type="select"
                name="nationality"
                options={this.nationalityOptions}
                label={t('PersonalInfo.nationality')}
                className="u-mh-0 u-mb-0"
              />
            </Stack>
            <PersonalInfoInfos />
          </Stack>
        }
        actions={
          <Button
            extension="full"
            busy={saving}
            disabled={saving}
            onClick={this.handleSave}
            label={t('PersonalInfo.save-cta')}
            variant="primary"
          />
        }
      />
    )
  }
}

PersonalInfoDialog.defaultProps = {
  // Can be overriden to specify other identity sources
  // The final
  sourceIdentitySelectors: [client => getDefaultIdentitySelector(client)]
}

export default compose(
  translate(),
  withClient,
  withBankingSlugs
)(PersonalInfoDialog)
