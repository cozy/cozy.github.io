import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Media, Bd, Img, translate } from 'cozy-ui/react'
import SettingCard from 'components/SettingCard'
import Switch from 'components/Switch'
import EditionModal from 'components/EditionModal'
import resultWithArgs from 'utils/resultWithArgs'
import { markdownBold } from './helpers'

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

const EditableSettingCard = props => {
  const {
    onChangeDoc,
    onToggle,
    editModalProps,
    shouldOpenOnToggle,
    doc
  } = props

  const enabled = doc.enabled
  const [editing, setEditing] = useState(false)
  const description = resolveDescriptionKey(props)

  return (
    <>
      <SettingCard
        enabled={enabled}
        onClick={editModalProps ? () => setEditing(true) : null}
      >
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
      {editing ? (
        <EditionModal
          {...editModalProps}
          initialDoc={doc}
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

EditableSettingCard.propTypes = {
  doc: PropTypes.object.isRequired
}

export default translate()(EditableSettingCard)
