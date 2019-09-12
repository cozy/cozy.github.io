import React from 'react'
import styles from 'components/KonnectorUpdateInfo/styles.styl'
import { translate, withBreakpoints } from 'cozy-ui/react'
import Text, { SubTitle } from 'cozy-ui/react/Text'
import Icon from 'cozy-ui/react/Icon'
import { ButtonLink } from 'cozy-ui/react/Button'
import { withClient } from 'cozy-client'
import { flowRight as compose } from 'lodash'
import { Intents } from 'cozy-interapp'
import { queryConnect } from 'cozy-client'
import { KONNECTOR_DOCTYPE } from 'doctypes'
import { isCollectionLoading } from 'ducks/client/utils'
import { Padded } from 'components/Spacing'
import CozyClient from 'cozy-client'

// Utilities on konnectors
const konnectors = {
  hasCategory: category => konnector => {
    return konnector.categories && konnector.categories.includes(category)
  }
}

class KonnectorUpdateInfo extends React.PureComponent {
  intents = new Intents({ client: this.props.client })

  state = {
    url: null
  }

  async componentDidMount() {
    try {
      const url = await this.intents.getRedirectionURL('io.cozy.apps', {
        type: 'konnector',
        category: 'banking',
        pendingUpdate: true
      })

      if (this.unmounted) {
        return
      }

      this.setState({ url })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Error while retrieving redirection URL', err)
    }
  }

  componentWillUnmount() {
    this.unmounted = true
  }

  render() {
    const { url } = this.state

    if (!url) {
      return null
    }

    const { t, breakpoints, outdatedKonnectors } = this.props

    if (isCollectionLoading(outdatedKonnectors)) {
      return null
    }

    if (outdatedKonnectors.hasMore) {
      outdatedKonnectors.fetchMore()
    }

    const bankingKonnectors = outdatedKonnectors.data.filter(
      konnectors.hasCategory('banking')
    )
    if (bankingKonnectors.length === 0) {
      return null
    }

    return (
      <Padded className={styles.KonnectorUpdateInfo}>
        <div className={styles.KonnectorUpdateInfo__inner}>
          <SubTitle className="u-monza">
            {t('KonnectorUpdateInfo.title')}
          </SubTitle>
          <Text
            tag="p"
            className="u-mt-half"
            dangerouslySetInnerHTML={{
              __html: t('KonnectorUpdateInfo.content')
            }}
          />
          <ButtonLink
            icon={<Icon icon="openwith" />}
            label={t('KonnectorUpdateInfo.cta')}
            theme="secondary"
            href={url}
            extension={breakpoints.isMobile ? 'full' : 'narrow'}
            className="u-mh-0"
          />
        </div>
      </Padded>
    )
  }
}

const outdatedKonnectors = {
  query: client =>
    client
      .all(KONNECTOR_DOCTYPE)
      .where({ available_version: { $exists: true } }),
  fetchPolicy: CozyClient.fetchPolicies.olderThan(30 * 1000),
  as: 'outdatedKonnectors'
}

export default compose(
  translate(),
  withClient,
  withBreakpoints(),
  queryConnect({
    outdatedKonnectors
  })
)(KonnectorUpdateInfo)
