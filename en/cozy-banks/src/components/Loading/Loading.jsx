import React from 'react'
import { Spinner, useI18n } from 'cozy-ui/transpiled/react'
import styles from 'components/Loading/Loading.styl'

/**
 * Use it for the loading of page/section
 */
export const Loading = ({ loadingType, noMargin }) => {
  const { t } = useI18n()
  return (
    <div className={styles['bnk-loading']}>
      <Spinner size="xxlarge" noMargin={noMargin} />
      {loadingType && <p>{t('Loading.loading')}</p>}
    </div>
  )
}

export default Loading
