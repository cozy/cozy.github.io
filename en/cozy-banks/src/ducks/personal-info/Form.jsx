import React from 'react'
import { translate } from 'cozy-ui/transpiled/react/I18n'
import { withClient } from 'cozy-client'
import Button from 'cozy-ui/transpiled/react/Button'
import Field from 'cozy-ui/transpiled/react/Field'
import Stack from 'cozy-ui/transpiled/react/Stack'
import compose from 'lodash/flowRight'

import countries from './nationalities.json'
import PersonalInfoInfos from 'ducks/personal-info/Infos'

const defaultNationality = { label: 'French', value: 'FR' }

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
 * Displays a form to fill personal info into the myself contact.
 */
class PersonalInfoForm extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.handleChangeField = this.handleChangeField.bind(this)
    this.handleSave = this.handleSave.bind(this)

    const myself = this.props.myself

    this.nationalityOptions = makeNationalitiesOptions(props.lang)
    this.state = {
      saving: false,
      formData: {
        birthcity: myself.birthcity,
        nationality:
          this.nationalityOptions.find(
            x => myself.nationality && x.value === myself.nationality
          ) || defaultNationality
      }
    }
  }

  render() {
    const { t } = this.props
    const { saving, formData } = this.state

    return (
      <Stack spacing="xl">
        <div>
          <Field
            value={formData.birthcity}
            onChange={ev =>
              this.handleChangeField('birthcity', ev.target.value)
            }
            type="text"
            name="birthcity"
            label={t('PersonalInfo.birthcity')}
            placeholder={t('PersonalInfo.birthcity-placeholder')}
          />
          <Field
            onChange={option => this.handleChangeField('nationality', option)}
            value={formData.nationality}
            type="select"
            name="nationality"
            options={this.nationalityOptions}
            label={t('PersonalInfo.nationality')}
          />
        </div>
        <PersonalInfoInfos />
        <div>
          <Button
            extension="full"
            busy={saving}
            disabled={saving}
            onClick={this.handleSave}
            label={t('PersonalInfo.save-cta')}
            variant="primary"
          />
        </div>
      </Stack>
    )
  }

  handleChangeField(name, value) {
    const formData = {
      ...this.state.formData,
      [name]: value
    }
    this.setState({
      formData
    })
  }

  async handleSave(ev) {
    const { client, onSaveSuccessful, myself } = this.props
    const { formData } = this.state
    ev && ev.preventDefault()
    this.setState({ saving: true })
    try {
      const attributes = {
        nationality: formData.nationality.value,
        birthcity: formData.birthcity
      }
      const updatedMyself = {
        ...myself,
        ...attributes
      }
      await client.save(updatedMyself)
      onSaveSuccessful && onSaveSuccessful(updatedMyself)
    } finally {
      this.setState({ saving: false })
    }
  }
}

export default compose(
  translate(),
  withClient
)(PersonalInfoForm)
