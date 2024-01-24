import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import Stack from 'cozy-ui/transpiled/react/Stack'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import AddRuleButton from 'ducks/settings/AddRuleButton'
import useList from './useList'
import { getRuleId, getNextRuleId } from './ruleUtils'
import { trackEvent, getPageLastPart } from 'ducks/tracking/browser'

export { AddRuleButton }

/**
 * Displays a list of rules and allows to create or edit one
 *
 * Manages the stack of rules, the button to add a rule and
 * and the creation modal
 */
const Rules = ({
  rules,
  children,
  onUpdate,
  onError,
  addButtonLabelKey,
  ItemEditionModal,
  makeNewItem,
  trackPageName
}) => {
  const { t } = useI18n()
  const [items, createOrUpdate, remove] = useList({
    list: rules,
    onUpdate,
    onError,
    getId: getRuleId,
    getNextId: getNextRuleId
  })
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleCreateItem = useCallback(
    async newItem => {
      setCreating(false)
      try {
        setSaving(true)
        await createOrUpdate(newItem)
      } finally {
        setSaving(false)
      }
    },
    [createOrUpdate]
  )

  const handleAddRule = useCallback(() => {
    setCreating(true)
    trackEvent({
      name: `${getPageLastPart(trackPageName)}-creer_alerte`
    })
  }, [trackPageName])

  return (
    <>
      {items.length > 0 ? (
        <Stack spacing="xs">
          {items
            ? items.map((item, i) => children(item, i, createOrUpdate, remove))
            : null}
        </Stack>
      ) : null}
      {creating ? (
        <ItemEditionModal
          onDismiss={() => setCreating(false)}
          initialDoc={makeNewItem()}
          onEdit={handleCreateItem}
          trackPageName={trackPageName}
        />
      ) : null}
      <AddRuleButton
        label={t(addButtonLabelKey)}
        busy={saving}
        onClick={handleAddRule}
      />
    </>
  )
}

Rules.propTypes = {
  rules: PropTypes.array.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  addButtonLabelKey: PropTypes.string.isRequired,
  makeNewItem: PropTypes.func.isRequired,
  ItemEditionModal: PropTypes.elementType.isRequired
}

export default Rules
