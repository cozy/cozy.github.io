import React from 'react'
import PropTypes from 'prop-types'
import styles from 'components/ErrorBoundary/Error.styl'
import { translate } from 'cozy-ui/transpiled/react'
import Empty from 'cozy-ui/transpiled/react/Empty'
import brokenIcon from 'assets/icons/icon-broken.svg'

const refreshLinkID = 'error-refresh-link'

class Error extends React.Component {
  static propTypes = {
    t: PropTypes.func.isRequired
  }

  rootRef = React.createRef()

  componentDidMount() {
    this.listenRefreshLinkClick()
  }

  componentDidUpdate() {
    this.listenRefreshLinkClick()
  }

  componentWillUnmount() {
    this.refreshLink.removeEventListener('click', this.refresh)
  }

  listenRefreshLinkClick() {
    if (this.refreshLink) {
      this.refreshLink.removeEventListener('click', this.refresh)
    }

    this.refreshLink = this.rootRef.current.querySelector('#' + refreshLinkID)
    this.refreshLink.addEventListener('click', this.refresh)
  }

  refresh = () => {
    window.location.reload(true)
  }

  render() {
    const { t, lang, getSupportURL } = this.props
    const update = t('Error.update')
      .replace('#{LINK}', `<a id="${refreshLinkID}">`)
      .replace('#{/LINK}', '</a>')
    const url = getSupportURL(lang)
    const contact = t('Error.contact')
      .replace('#{LINK}', `<a href="${url}" target="_blank">`)
      .replace('#{/LINK}', '</a>')

    return (
      <div className={styles.Error} ref={this.rootRef}>
        <Empty
          className={styles.Empty}
          icon={brokenIcon}
          title={t('Error.title')}
          text={
            <span
              dangerouslySetInnerHTML={{ __html: `${update}</br>${contact}` }}
            />
          }
        />
      </div>
    )
  }
}

Error.defaultProps = {
  getSupportURL: lang =>
    `https://cozy.io/${lang === 'fr' ? 'fr' : 'en'}/support/`
}

export default translate()(Error)
