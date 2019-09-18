import React from 'react'
import compose from 'lodash/flowRight'
import styles from './styles.styl'
import { withBreakpoints } from 'cozy-ui/react'
import Text, { SubTitle } from 'cozy-ui/react/Text'
import { ButtonLink } from 'cozy-ui/react/Button'
import cx from 'classnames'

// TODO Move ErrorCard to cozy-ui
const ErrorCard = ({
  breakpoints,
  title,
  content,
  buttonLabel,
  buttonHref,
  buttonIcon,
  style
}) => {
  return (
    <div className={styles.ErrorCard} style={style}>
      <SubTitle className="u-monza">{title}</SubTitle>
      {typeof content === 'string' ? (
        <Text
          tag="p"
          className={cx('u-mt-half', styles.ErrorCard__text)}
          dangerouslySetInnerHTML={{
            __html: content
          }}
        />
      ) : (
        content
      )}
      <ButtonLink
        theme="secondary"
        extension={breakpoints.isMobile ? 'full' : 'narrow'}
        className="u-mh-0"
        label={buttonLabel}
        icon={buttonIcon}
        href={buttonHref}
      />
    </div>
  )
}

export default compose(
  withBreakpoints(),
  React.memo
)(ErrorCard)
