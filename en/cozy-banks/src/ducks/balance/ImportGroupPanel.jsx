import cx from 'classnames'
import React, { useEffect, useState } from 'react'

import AccordionSummary from '@material-ui/core/AccordionSummary'
import AccordionDetails from '@material-ui/core/AccordionDetails'
import Accordion from 'cozy-ui/transpiled/react/MuiCozyTheme/Accordion'

import { withStyles } from '@material-ui/core/styles'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import styles from 'ducks/balance/GroupPanel.styl'

import Typography from 'cozy-ui/transpiled/react/Typography'
import List from 'cozy-ui/transpiled/react/MuiCozyTheme/List'
import AccountIcon from 'components/AccountIcon'
import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import { useJobsContext } from 'components/JobsContext'
import { Q, useClient } from 'cozy-client'
import { KONNECTOR_DOCTYPE } from 'doctypes'
import Spinner from 'cozy-ui/transpiled/react/Spinner'

export const GroupPanelSummary = withStyles({
  root: {
    maxHeight: '3.5rem',
    height: '3.5rem'
  },
  content: {
    paddingLeft: '3rem',
    paddingRight: '0',
    height: '100%'
  },
  expanded: {},
  expandIcon: {
    left: '0.375rem',
    right: 'auto',
    transform: 'translateY(-50%) rotate(-90deg)',
    '&$expanded': {
      transform: 'translateY(-50%) rotate(0)'
    }
  }
})(AccordionSummary)

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
  const { jobsInProgress = [] } = useJobsContext()
  const [expanded, setExpanded] = useState(true)

  if (jobsInProgress.length === 0) {
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

const Row = ({ account, t }) => {
  const slug = account.konnector

  const client = useClient()
  const [name, setName] = useState('')

  useEffect(() => {
    const slug = account.konnector
    client
      .query(Q(KONNECTOR_DOCTYPE).getById(`${KONNECTOR_DOCTYPE}/${slug}`))
      .then(resp => {
        const name = resp.data.attributes.name
        setName(name)
      })
  }, [account.konnector, client])

  // @TODO use 'useQuery' instead of 'client'
  // const resp = useQuery(konnectorConn.query(slug), konnectorConn)
  // const name = get(resp, 'data[0].attributes.name', '')

  return (
    <ListItem button disableRipple>
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
}

export default ImportGroupPanel
