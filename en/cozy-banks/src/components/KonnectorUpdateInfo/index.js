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

    const { t, breakpoints, konnectorsCollection } = this.props

    if (isCollectionLoading(konnectorsCollection)) {
      return null
    }

    if (konnectorsCollection.hasMore) {
      konnectorsCollection.fetchMore()
    }

    if (konnectorsCollection.data.length === 0) {
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

export default compose(
  translate(),
  withClient,
  withBreakpoints(),
  queryConnect({
    konnectorsCollection: {
      query: client =>
        client
          .all(KONNECTOR_DOCTYPE)
          .where({ available_version: { $exists: true } })
    }
  })
)(KonnectorUpdateInfo)
