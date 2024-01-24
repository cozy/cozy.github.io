import React from 'react'
import PropTypes from 'prop-types'
import Padded from 'components/Padded'

import { translate } from 'cozy-ui/transpiled/react/providers/I18n'
import Input from 'cozy-ui/transpiled/react/Input'
import InputGroup from 'cozy-ui/transpiled/react/InputGroup'
import Label from 'cozy-ui/transpiled/react/Label'

import PageTitle from 'components/Title/PageTitle'
import BottomButton from 'components/BottomButton'
import { trackPage } from 'ducks/tracking/browser'

import Title from 'ducks/transfers/steps/Title'

const MINIMUM_AMOUNT = 5
const MAXIMUM_AMOUNT = 1000

const validateAmount = amount => {
  if (amount == '') {
    return { ok: true }
  } else if (parseInt(amount, 10) > MAXIMUM_AMOUNT) {
    return { error: 'too-high', maximum: MAXIMUM_AMOUNT }
  } else if (parseInt(amount, 10) < MINIMUM_AMOUNT) {
    return { error: 'too-low', minimum: MINIMUM_AMOUNT }
  } else if (isNaN(parseInt(amount, 10))) {
    return { error: 'incorrect-number', value: amount }
  }

  return { ok: true }
}

const errorToTrackPage = {
  'too-high': 'erreur-montant_maximum',
  'too-low': 'erreur-montant_minimum',
  'incorrect-number': 'erreur-chiffres'
}

class _ChooseAmount extends React.PureComponent {
  constructor(props, context) {
    super(props, context)
    this.state = { validation: { ok: true } }
    this.handleBlur = this.handleBlur.bind(this)
  }

  componentDidUpdate(prevProps, prevState) {
    this.checkToIncreaseSlideHeight(prevState)
  }

  checkToIncreaseSlideHeight(prevState) {
    if (
      Boolean(prevState.validation.error) !==
      Boolean(this.state.validation.error)
    ) {
      this.context.swipeableViews.slideUpdateHeight()
    }
  }

  handleBlur() {
    this.validate()
  }

  validate() {
    const validationResult = validateAmount(this.props.amount)
    if (!validationResult.ok) {
      const errorPage = errorToTrackPage[validationResult.error]
      trackPage(lastTracked => {
        const page = `virement:montant:${errorPage}`
        if (page == lastTracked) {
          return false
        }
        return page
      })
    }
    this.setState({ validation: validationResult })
  }

  render() {
    const { t, amount, onChange, onSelect, active } = this.props
    const validation = this.state.validation
    return (
      <Padded>
        {active && <PageTitle>{t('Transfer.amount.page-title')}</PageTitle>}
        <Title>{t('Transfer.amount.title')}</Title>
        <Label>
          {t('Transfer.amount.field-label')}
          <br />
          <InputGroup append={<InputGroup.Unit>€</InputGroup.Unit>}>
            <Input
              className="u-mt-0"
              value={amount}
              onChange={ev => onChange(ev.target.value)}
              step="any"
              onBlur={this.handleBlur}
              error={Boolean(validation.error)}
              placeholder="10"
            />
          </InputGroup>
        </Label>
        {validation.error ? (
          <p className="u-error">
            {t(`Transfer.amount.errors.${validation.error}`, validation)}
          </p>
        ) : null}
        <BottomButton
          disabled={amount === '' || !!validation.error}
          label={t('Transfer.amount.confirm')}
          visible={active}
          onClick={onSelect}
        />
      </Padded>
    )
  }
}

_ChooseAmount.contextTypes = {
  swipeableViews: PropTypes.object.isRequired
}

const ChooseAmount = React.memo(translate()(_ChooseAmount))

export default ChooseAmount
