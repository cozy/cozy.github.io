import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Stack, Button, translate } from 'cozy-ui/react'
import useList from './useList'
import { getRuleId, getNextRuleId } from './ruleUtils'
import cx from 'classnames'
import styles from './Rules.styl'

export const AddRuleButton = ({ label, busy, onClick }) => (
  <Button
    className={cx('u-ml-0 u-mb-0', styles.AddRuleButton)}
    theme="subtle"
    icon="plus"
    label={label}
    busy={busy}
    onClick={onClick}
  />
)

const Rules = ({
  rules,
  children,
  onUpdate,
  onError,
  addButtonLabelKey,
  ItemEditionModal,
  makeNewItem,
  t
}) => {
  const [items, createOrUpdate, remove] = useList({
    list: rules,
    onUpdate,
    onError,
    getId: getRuleId,
    getNextId: getNextRuleId
  })
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const handleCreateItem = async newItem => {
    setCreating(false)
    try {
      setSaving(true)
      await createOrUpdate(newItem)
    } finally {
      setSaving(false)
    }
  }
  return (
    <>
      {items.length > 0 ? (
        <Stack spacing="xs">
          {items
            ? items.map((item, i) => children(item, i, createOrUpdate, remove))
            : null}

          {creating ? (
            <ItemEditionModal
              onDismiss={() => setCreating(false)}
              initialDoc={makeNewItem()}
              onEdit={handleCreateItem}
            />
          ) : null}
        </Stack>
      ) : null}
      <AddRuleButton
        label={t(addButtonLabelKey)}
        busy={saving}
        onClick={() => {
          setCreating(true)
        }}
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

export default translate()(Rules)
