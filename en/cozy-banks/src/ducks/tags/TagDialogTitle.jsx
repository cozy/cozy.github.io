import React from 'react'
import PropTypes from 'prop-types'

import makeStyles from 'cozy-ui/transpiled/react/helpers/makeStyles'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Figure from 'cozy-ui/transpiled/react/Figure'
import Icon from 'cozy-ui/transpiled/react/Icon'
import Typography from 'cozy-ui/transpiled/react/Typography'
import PenIcon from 'cozy-ui/transpiled/react/Icons/Pen'
import TrashIcon from 'cozy-ui/transpiled/react/Icons/Trash'

import { getCurrencySymbol } from 'utils/currencySymbol'
import { countTransactions } from 'components/Tag/helpers'

const useStyles = makeStyles({
  box: {
    padding: '1.75rem 2rem 1.25rem'
  },
  mobileTopBox: {
    display: 'flex',
    flexDirection: 'row',
    margin: '-.5rem 0 -.5rem 2rem',
    gap: '.5rem'
  },
  desktopTopBox: {
    display: 'flex',
    flexDirection: 'row',
    margin: '-.5rem 0',
    gap: '.5rem'
  },
  subBox: {
    flex: '1'
  },
  bottomBox: {
    display: 'flex',
    margin: '1.25rem 0 .25rem 0',
    gap: '.5rem'
  },
  mobileButton: {
    flex: '1'
  },
  desktopButton: {
    flex: '0 auto'
  },
  typography: {
    placeSelf: 'center'
  }
})

const TagDialogTitle = ({
  tag,
  amount,
  currency,
  setIsRenameModalOpened,
  setIsDeleteModalOpened
}) => {
  const { isMobile } = useBreakpoints()
  const styles = useStyles()
  const { t } = useI18n()
  return (
    <div className={isMobile ? null : styles.box}>
      <div className={isMobile ? styles.mobileTopBox : styles.desktopTopBox}>
        <div className={styles.subBox}>
          <Typography variant="h4">{tag.label}</Typography>
          <Typography variant="caption">
            {t('Tag.transactions', {
              smart_count: countTransactions(tag)
            })}
          </Typography>
        </div>
        <Typography variant="h6" className={styles.typography}>
          <Figure
            total={amount}
            symbol={getCurrencySymbol(currency)}
            coloredPositive
            signed
          />
        </Typography>
      </div>
      <div className={styles.bottomBox}>
        <Button
          className={isMobile ? styles.mobileButton : styles.desktopButton}
          variant="secondary"
          startIcon={<Icon icon={PenIcon} />}
          label={t('Tag.renameModal.title')}
          onClick={() => setIsRenameModalOpened(true)}
        />
        <Button
          className={isMobile ? styles.mobileButton : styles.desktopButton}
          color="error"
          variant="secondary"
          startIcon={<Icon icon={TrashIcon} />}
          label={t('Tag.deleteModal.title')}
          onClick={() => setIsDeleteModalOpened(true)}
        />
      </div>
    </div>
  )
}

TagDialogTitle.propTypes = {
  tag: PropTypes.object.isRequired,
  amount: PropTypes.number.isRequired,
  currency: PropTypes.string.isRequired,
  setIsRenameModalOpened: PropTypes.func.isRequired,
  setIsDeleteModalOpened: PropTypes.func.isRequired
}

export default TagDialogTitle
