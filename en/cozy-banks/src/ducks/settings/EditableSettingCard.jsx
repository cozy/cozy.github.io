import React, { useState, useMemo, memo } from 'react'
import PropTypes from 'prop-types'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/deprecated/Media'
import Icon from 'cozy-ui/transpiled/react/Icon'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import resultWithArgs from 'utils/resultWithArgs'
import { markdownBold } from './helpers'

import useConfirmation from 'components/useConfirmation'
import SettingCard from 'components/SettingCard'
import Switch from 'cozy-ui/transpiled/react/Switch'
import EditionModal from 'components/EditionModal'

import IconButton from 'cozy-ui/transpiled/react/IconButton'
import CrossMediumIcon from 'cozy-ui/transpiled/react/Icons/CrossMedium'

const styles = {
  crossButton: {
    position: 'absolute',
    top: '0.25rem',
    right: '0.25rem'
  }
}

export const CrossButton = ({ onClick }) => (
  <IconButton onClick={onClick} style={styles.crossButton} size="medium">
    <Icon color="var(--coolGrey)" icon={CrossMediumIcon} size={12} />
  </IconButton>
)

export const SettingCardRemoveConfirmation = ({
  onRemove,
  description,
  title
}) => {
  const { component, requestOpen } = useConfirmation({
    onConfirm: onRemove,
    title: title,
    description: description
  })
  return (
    <>
      <CrossButton onClick={requestOpen} />
      {component}
    </>
  )
}

// Since the toggle has a large height, we need to compensate negatively
// so that the height of the switch does not impact the height of the card
const toggleStyle = { margin: '-8px 0' }

const resolveDescriptionKey = props => {
  const propArgs = [props]
  const descriptionKeyStr = resultWithArgs(props, 'descriptionKey', propArgs)
  const descriptionProps =
    resultWithArgs(props, 'descriptionProps', propArgs) || props.doc

  return props.t(descriptionKeyStr, descriptionProps)
}

const SettingCardSwitch = ({ checked, onClick, onChange }) => (
  <Switch
    disableRipple
    className="u-mh-s"
    checked={checked}
    color="primary"
    onClick={onClick}
    onChange={onChange}
  />
)

const EditableSettingCard = props => {
  const { t } = useI18n()
  const {
    onChangeDoc,
    onToggle,
    onRemove,
    removeModalTitle,
    removeModalDescription,
    editModalProps,
    shouldOpenOnToggle,
    doc,
    canBeRemoved,
    onRemoveDoc,
    trackPageName
  } = props

  const enabled = doc.enabled
  const [editing, setEditing] = useState(false)
  const description = resolveDescriptionKey({ ...props, t })

  const handleSwitchChange = () => {
    const shouldOpen = shouldOpenOnToggle ? shouldOpenOnToggle(props) : false
    if (shouldOpen) {
      setEditing(true)
    } else {
      onToggle(!enabled)
    }
  }

  const onClick = useMemo(
    () => (editModalProps ? () => setEditing(true) : null),
    [setEditing, editModalProps]
  )

  return (
    <>
      <SettingCard enabled={enabled} onClick={onClick}>
        <Media className="u-row-xs" align="top">
          <Bd>
            <span
              dangerouslySetInnerHTML={{
                __html: markdownBold(description)
              }}
            />
          </Bd>
          {onToggle ? (
            <Img style={toggleStyle}>
              <SettingCardSwitch
                checked={enabled}
                onClick={e => e.stopPropagation()}
                onChange={handleSwitchChange}
              />
            </Img>
          ) : null}
          {onRemove ? (
            <SettingCardRemoveConfirmation
              title={removeModalTitle}
              description={removeModalDescription}
              onRemove={onRemove}
            />
          ) : null}
        </Media>
      </SettingCard>
      {editing ? (
        <EditionModal
          {...editModalProps}
          canBeRemoved={canBeRemoved}
          onRemove={onRemoveDoc}
          removeModalTitle={removeModalTitle}
          removeModalDescription={removeModalDescription}
          initialDoc={doc}
          onEdit={updatedDoc => {
            onChangeDoc(updatedDoc)
            setEditing(false)
          }}
          onDismiss={() => setEditing(false)}
          okButtonLabel={() => t('EditionModal.ok')}
          cancelButtonLabel={() => t('EditionModal.cancel')}
          removeButtonLabel={() => t('EditionModal.remove')}
          trackPageName={trackPageName}
        />
      ) : null}
    </>
  )
}

EditableSettingCard.propTypes = {
  doc: PropTypes.object.isRequired
}

export default memo(EditableSettingCard)
