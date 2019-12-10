import React, { useState } from 'react'
import { Media, Bd, Img, translate } from 'cozy-ui/react'
import SettingCard from 'components/SettingCard'
import { ToggleRowTitle, ToggleRowWrapper } from './ToggleRow'
import Switch from 'components/Switch'
import EditionModal from 'components/EditionModal'

// Since the toggle has a large height, we need to compensate negatively
// so that the height of the switch does not impact the height of the card
const toggleStyle = { margin: '-8px 0' }

const rx = /\*(.*?)\*/g
const markdownBold = str => {
  return str.replace(rx, function(a) {
    return '<b>' + a.slice(1, -1) + '</b>'
  })
}

const EditableSettingCard = props => {
  const {
    enabled,
    title,
    description,
    onChangeDoc,
    onToggle,
    editModalProps,
    shouldOpenOnToggle,
    descriptionKey,
    t,
    value
  } = props

  const [editing, setEditing] = useState(false)

  const finalDescription = descriptionKey
    ? t(descriptionKey, { value })
    : description

  return (
    <>
      <ToggleRowWrapper>
        {title && <ToggleRowTitle>{title}</ToggleRowTitle>}
        <SettingCard
          enabled={enabled}
          clickable={editModalProps}
          onClick={editModalProps ? () => setEditing(true) : null}
        >
          <Media className="u-row-xs" align="top">
            <Bd>
              {typeof finalDescription === 'string' ? (
                <span
                  dangerouslySetInnerHTML={{
                    __html: markdownBold(finalDescription)
                  }}
                />
              ) : (
                finalDescription
              )}
            </Bd>
            {onToggle ? (
              <Img style={toggleStyle}>
                <Switch
                  disableRipple
                  className="u-mh-s"
                  checked={enabled}
                  color="primary"
                  onClick={e => e.stopPropagation()}
                  onChange={() => {
                    const shouldOpen = shouldOpenOnToggle
                      ? shouldOpenOnToggle(props)
                      : false
                    if (shouldOpen) {
                      setEditing(true)
                    } else {
                      onToggle(!enabled)
                    }
                  }}
                />
              </Img>
            ) : null}
          </Media>
        </SettingCard>
      </ToggleRowWrapper>
      {editing ? (
        <EditionModal
          {...editModalProps}
          onEdit={updatedDoc => {
            onChangeDoc(updatedDoc)
            setEditing(false)
          }}
          onDismiss={() => setEditing(false)}
          okButtonLabel={() => 'OK'}
          cancelButtonLabel={() => 'Cancel'}
        />
      ) : null}
    </>
  )
}

export default translate()(EditableSettingCard)
