import React from 'react'
import { Link, useLocation } from 'react-router-dom'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Icon from 'cozy-ui/transpiled/react/Icon'
import Typography from 'cozy-ui/transpiled/react/Typography'
import Chip from 'cozy-ui/transpiled/react/deprecated/Chip'

import ListItemArrow from 'components/ListItemArrow'
import iconRecurrence from 'components/IconRecurrence'
import { getFrequencyText } from 'ducks/recurrence/utils'
import { stopPropagation } from 'ducks/transactions/TransactionModal/helpers'

const RecurrenceRow = ({ transaction, onClick }) => {
  const location = useLocation()
  const recurrence = transaction.recurrence && transaction.recurrence.data
  const { t } = useI18n()

  const recurrenceRoute = recurrence
    ? `/analysis/recurrence/${recurrence._id}`
    : null

  const vAlignTop = Boolean(recurrence)
  return (
    <ListItem
      divider
      button
      disableRipple
      alignItems={vAlignTop ? 'flex-start' : undefined}
      onClick={onClick}
    >
      <ListItemIcon>
        <Icon
          icon={iconRecurrence}
          className={vAlignTop ? 'u-mt-1-half' : null}
        />
      </ListItemIcon>
      <ListItemText>
        <div>
          {recurrence
            ? t('Recurrence.choice.recurrent')
            : t('Recurrence.choice.not-recurrent')}
          {recurrence ? (
            <>
              <br />
              <Typography variant="caption" color="textSecondary">
                {getFrequencyText(t, recurrence)}
              </Typography>
              {location.pathname !== recurrenceRoute ? (
                <Link to={recurrenceRoute} className="u-link">
                  <div className="u-mh-1">
                    <Chip
                      onClick={stopPropagation}
                      variant="outlined"
                      size="small"
                      className="u-w-100 u-ph-2 u-mt-half u-flex-justify-center"
                    >
                      {t('Recurrence.see-transaction-history')}
                    </Chip>
                  </div>
                </Link>
              ) : null}
            </>
          ) : null}
        </div>
      </ListItemText>
      <ListItemArrow className={vAlignTop ? 'u-mt-1-half' : null} />
    </ListItem>
  )
}

export default React.memo(RecurrenceRow)
