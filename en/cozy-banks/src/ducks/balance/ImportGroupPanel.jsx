import cx from 'classnames'
import React, { useState } from 'react'

import AccordionSummary from 'cozy-ui/transpiled/react/AccordionSummary'
import AccordionDetails from 'cozy-ui/transpiled/react/AccordionDetails'
import Accordion from 'cozy-ui/transpiled/react/Accordion'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import styles from 'ducks/balance/GroupPanel/GroupPanel.styl'

import { withStyles } from 'cozy-ui/transpiled/react/styles'
import Typography from 'cozy-ui/transpiled/react/Typography'
import List from 'cozy-ui/transpiled/react/List'
import AccountIcon from 'components/AccountIcon'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import { useBanksContext } from 'ducks/context/BanksContext'
import Spinner from 'cozy-ui/transpiled/react/Spinner'

export const GroupPanelSummary = withStyles(theme => ({
  root: {},
  expandIcon: {
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(0),
    color: theme.palette.grey[400]
  },
  expanded: {},
  content: {
    marginTop: 0,
    marginBottom: 0,
    paddingRight: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    '&$expanded': {
      marginTop: 0,
      marginBottom: 0,
      paddingRight: 0
    }
  }
}))(AccordionSummary)

const EllipseTypography = withStyles({
  root: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }
})(Typography)

const ListItemTextColumn = withStyles({
  root: {
    flexBasis: '100%',
    paddingRight: '1rem'
  }
})(ListItemText)

const PrimaryColumn = withStyles({
  root: {
    flexBasis: '200%' // Primary column is twice as large as other columns
  }
})(ListItemTextColumn)

const ImportGroupPanel = () => {
  const { t } = useI18n()
  const { jobsInProgress = [], hasJobsInProgress } = useBanksContext()
  const [expanded, setExpanded] = useState(true)

  if (!hasJobsInProgress) {
    return null
  }

  return (
    <Accordion expanded={expanded} onClick={() => setExpanded(!expanded)}>
      <GroupPanelSummary
        className={cx({
          [styles['GroupPanelSummary--unchecked']]: false
        })}
      >
        <div className={styles.GroupPanelSummary__content}>
          <div className={styles.GroupPanelSummary__labelBalanceWrapper}>
            <div className={styles.GroupPanelSummary__label}>
              {t('Balance.import-accounts')}
            </div>
          </div>
        </div>
        <div className="u-flex u-flex-items-center u-mr-1">
          <Spinner size="large" />
        </div>
      </GroupPanelSummary>
      <AccordionDetails>
        <div className="u-flex-grow-1 u-maw-100">
          <List>
            {jobsInProgress.map((a, i) => (
              <Row key={i} account={a} t={t} />
            ))}
          </List>
        </div>
      </AccordionDetails>
    </Accordion>
  )
}

const Row = React.memo(({ account, t }) => {
  const name = account.institutionLabel
  const slug = account.konnector

  return (
    <ListItem
      disabled
      onClick={ev => {
        ev.stopPropagation()
      }}
    >
      <ListItemIcon>
        <AccountIcon
          account={{
            cozyMetadata: {
              createdByApp: slug
            }
          }}
        />
      </ListItemIcon>
      <PrimaryColumn disableTypography>
        <EllipseTypography variant="body1" color="textPrimary">
          {name}
        </EllipseTypography>
        <Typography variant="caption" color="textSecondary">
          {t('Balance.import-in-progress')}
        </Typography>
      </PrimaryColumn>
    </ListItem>
  )
})
Row.displayName = 'Import Group Panel Row'

export default ImportGroupPanel
