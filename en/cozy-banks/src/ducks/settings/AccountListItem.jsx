import React from 'react'
import PropTypes from 'prop-types'
import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemIcon'
import KonnectorIcon from 'cozy-harvest-lib/dist/components/KonnectorIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import ListItemSecondaryAction from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemSecondaryAction'
import { AccountIconContainer } from 'components/AccountIcon'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import Icon from 'cozy-ui/transpiled/react/Icon'
import RightIcon from 'cozy-ui/transpiled/react/Icons/Right'
import { getAccountInstitutionLabel } from 'ducks/account/helpers'
import WarningIcon from 'cozy-ui/transpiled/react/Icons/Warning'

const konnectorIconStyle = { width: 16, height: 16 }

const AccountListItem = ({
  account,
  onClick,
  secondary,
  isLoading,
  hasError
}) => {
  return (
    <ListItem button divider onClick={onClick}>
      <ListItemIcon>
        <AccountIconContainer>
          <KonnectorIcon
            style={konnectorIconStyle}
            konnectorSlug={
              account.cozyMetadata ? account.cozyMetadata.createdByApp : null
            }
          />
        </AccountIconContainer>
      </ListItemIcon>
      <ListItemText
        primary={getAccountInstitutionLabel(account)}
        secondary={secondary}
      />
      {hasError && (
        <Icon
          icon={WarningIcon}
          color="var(--errorColor)"
          className="u-mr-half"
          data-testid="error-konn"
        />
      )}

      <ListItemSecondaryAction>
        {isLoading ? (
          <Spinner size="large" className="u-mr-1" />
        ) : (
          <Icon icon={RightIcon} className="u-coolGrey u-mr-1" />
        )}
      </ListItemSecondaryAction>
    </ListItem>
  )
}

AccountListItem.propTypes = {
  account: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
  secondary: PropTypes.oneOfType([
    PropTypes.string.isRequired,
    PropTypes.object.isRequired
  ]),
  isLoading: PropTypes.bool,
  hasError: PropTypes.bool
}

export default AccountListItem
