import React from 'react'
import Padded from 'components/Padded'
import { PageTitle } from 'components/Title'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import { MobileBarSearchIconLink } from 'ducks/search/SearchIconLink'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

const PageTitleBalanceHeader = () => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const titlePaddedClass = isMobile ? 'u-p-0' : 'u-pb-0'
  return (
    <>
      <MobileBarSearchIconLink />
      {isMobile && (
        <Padded className={titlePaddedClass}>
          <PageTitle>{t('Balance.title')}</PageTitle>
        </Padded>
      )}
    </>
  )
}

export default React.memo(PageTitleBalanceHeader)
