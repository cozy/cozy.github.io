import Settings from 'ducks/settings/Settings'
import AccountsSettings from 'ducks/settings/AccountsSettings'
import ExistingGroupSettings from 'ducks/settings/GroupSettings/ExistingGroupSettings'
import NewGroupSettings from 'ducks/settings/GroupSettings/NewGroupSettings'
import GroupsSettings from 'ducks/settings/GroupsSettings'
import TagsSettings from 'ducks/settings/TagsSettings'
import Configuration from 'ducks/settings/Configuration'

export { getDefaultedSettingsFromCollection } from './helpers'

// components
export {
  Settings,
  AccountsSettings,
  GroupsSettings,
  ExistingGroupSettings,
  NewGroupSettings,
  TagsSettings,
  Configuration
}
