/* global __TARGET__ */
import React, { Component } from 'react'
import { Outlet } from 'react-router-dom'
import PropTypes from 'prop-types'
import ReactMarkdown from 'react-markdown'
import tosIcon from 'assets/icons/icon-tos.svg'

import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Typography from 'cozy-ui/transpiled/react/Typography'
import Icon from 'cozy-ui/transpiled/react/Icon'
import Button from 'cozy-ui/transpiled/react/Button'
import Alerter from 'cozy-ui/transpiled/react/Alerter'
import { IllustrationDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Stack from 'cozy-ui/transpiled/react/Stack'

import { withClient } from 'cozy-client'

const TosUpdatedModal = ({ newTosLink, onAccept, onRefuse }) => {
  const { t } = useI18n()

  return (
    <IllustrationDialog
      open
      actionsLayout="column"
      title={
        <Stack spacing="m" className="u-ta-center">
          <Icon icon={tosIcon} width={96} height={96} />
          <Typography className="u-ta-center" variant="h4">
            {t('TOS.updated.title')}
          </Typography>
        </Stack>
      }
      content={
        <ReactMarkdown source={t('TOS.updated.detail', { link: newTosLink })} />
      }
      actions={
        <>
          <Button
            subtle
            size="small"
            className="u-flex-grow-1"
            label={t('TOS.updated.disconnect')}
            onClick={onRefuse}
          />
          <Button
            className="u-mb-1"
            label={t('TOS.updated.cta')}
            onClick={onAccept}
          />
        </>
      }
    />
  )
}

class UserActionRequired extends Component {
  static contextTypes = {
    store: PropTypes.object.isRequired,
    client: PropTypes.object.isRequired
  }

  state = {
    warnings: []
  }

  componentDidMount() {
    if (__TARGET__ === 'mobile') {
      this.checkIfUserActionIsRequired()
      document.addEventListener('resume', this.checkIfUserActionIsRequired)
    }
  }

  componentWillUnmount() {
    if (__TARGET__ === 'mobile') {
      document.removeEventListener('resume', this.checkIfUserActionIsRequired)
    }
  }

  checkIfUserActionIsRequired = async () => {
    const cozyClient = this.props.client
    try {
      await cozyClient.stackClient.fetchJSON('GET', '/data/')
      const wasBlocked = this.state.warnings.length !== 0
      if (wasBlocked) {
        this.setState({ warnings: this.state.warnings })
      }
    } catch (e) {
      if (e.status === 402) {
        this.setState({ warnings: e.reason })
      }
    }
  }

  onAccept = async () => {
    await this.acceptUpdatedTos()
  }

  acceptUpdatedTos = async () => {
    const cozyClient = this.props.client
    try {
      await cozyClient.stackClient.fetchJSON(
        'PUT',
        '/settings/instance/sign_tos'
      )
      this.setState({
        warnings: this.state.warnings.filter(w => w.code !== 'tos-updated')
      })
    } catch (e) {
      Alerter.error('TOS.updated.error')
    }
  }

  disconnect = () => {
    const { client } = this.props
    client.logout()
  }

  render() {
    const { warnings } = this.state
    if (warnings.length === 0) return <Outlet />
    const tosUpdated = warnings.find(w => w.code === 'tos-updated')
    if (__TARGET__ === 'mobile' && tosUpdated) {
      return (
        <TosUpdatedModal
          newTosLink={tosUpdated.links.self}
          onAccept={this.onAccept}
          onRefuse={this.disconnect}
        />
      )
    }

    return <Outlet />
  }
}

export default withClient(UserActionRequired)
