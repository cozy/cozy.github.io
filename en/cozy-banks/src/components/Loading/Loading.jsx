import React from 'react'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import styles from 'components/Loading/Loading.styl'

/**
 * Use it for the loading of page/section
 */
export const Loading = ({ color, loadingType, noMargin, spinnerSize }) => {
  const { t } = useI18n()
  return (
    <div className={styles['bnk-loading']}>
      <Spinner size={spinnerSize} noMargin={noMargin} color={color} />
      {loadingType && <p>{t('Loading.loading')}</p>}
    </div>
  )
}

Loading.defaultProps = {
  spinnerSize: 'xxlarge'
}

export default Loading
