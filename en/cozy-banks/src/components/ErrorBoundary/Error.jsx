import React from 'react'
import PropTypes from 'prop-types'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Empty from 'cozy-ui/transpiled/react/Empty'
import brokenIcon from 'assets/icons/icon-broken.svg'
import Padded from 'components/Padded'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { Button, ButtonLink } from 'cozy-ui/transpiled/react/deprecated/Button'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import styles from 'components/ErrorBoundary/Error.styl'

export const Error = React.memo(({ faqURL, emptyIcon }) => {
  const { t, lang } = useI18n()
  const { isMobile } = useBreakpoints()
  const supportURL =
    faqURL || `https://cozy.io/${lang === 'fr' ? 'fr' : 'en'}/support/`
  const onReloadPage = () => window.location.reload(true)

  const buttonsClassName = isMobile
    ? 'u-pos-fixed u-bottom-xxl u-left-0 u-right-0 u-stack-s u-mr-1-half u-ml-1 u-mb-2'
    : `u-stack-s ${styles['Error--buttons']}`

  return (
    <>
      <Padded className="u-flex u-flex-column u-flex-items-center u-mt-3">
        <Empty
          layout={false}
          icon={emptyIcon}
          className="u-p-0"
          title={t('Error.title')}
          text={
            <Typography
              component="span"
              variant="body1"
              className="u-mt-1 u-ta-center"
            >
              {t('Error.retry')}
            </Typography>
          }
        />
      </Padded>
      <div className={buttonsClassName}>
        <Button
          className="u-w-100"
          onClick={onReloadPage}
          theme="primary"
          label={t('Error.reload-page')}
        />
        <ButtonLink
          className="u-w-100"
          href={supportURL}
          target="_blank"
          theme="secondary"
          label={t('Error.consult-faq')}
          data-testid="consult-button"
        />
      </div>
    </>
  )
})

Error.displayName = 'Error'
Error.propTypes = {
  emptyIcon: PropTypes.object
}
Error.defaultProps = {
  emptyIcon: brokenIcon
}

export default Error
