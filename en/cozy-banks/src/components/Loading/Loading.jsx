import React from 'react'
import { translate, Spinner } from 'cozy-ui/react'
import styles from 'components/Loading/Loading.styl'

/**
 * Use it for the loading of page/section
 */
export const Loading = ({ t, loadingType, noMargin }) => {
  return (
    <div className={styles['bnk-loading']}>
      <Spinner size="xxlarge" noMargin={noMargin} />
      {loadingType && <p>{t('Loading.loading')}</p>}
    </div>
  )
}

export default translate()(Loading)
