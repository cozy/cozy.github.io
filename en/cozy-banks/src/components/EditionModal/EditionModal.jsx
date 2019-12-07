import React, { useState } from 'react'
import {
  Button,
  Modal,
  ModalFooter,
  ModalButtons
} from 'cozy-ui/transpiled/react'

import Stepper from 'components/Stepper'

import { CategoryChoice } from 'ducks/categories'
import AccountGroupChoice from 'ducks/settings/CategoryAlerts/AccountGroupChoice'

import { ModalSections } from 'components/ModalSections'
import AccountOrGroupSection from './AccountOrGroupSection'
import CategorySection from './CategorySection'
import ThresholdSection from './ThresholdSection'

export const CHOOSING_TYPES = {
  category: 'category',
  accountOrGroup: 'accountOrGroup',
  threshold: 'threshold'
}

const SectionsPerType = {
  [CHOOSING_TYPES.category]: CategorySection,
  [CHOOSING_TYPES.accountOrGroup]: AccountOrGroupSection,
  [CHOOSING_TYPES.threshold]: ThresholdSection
}

const ChoosingSwitch = ({ choosing }) => {
  return (
    <>
      {choosing.type === CHOOSING_TYPES.category ? (
        <CategoryChoice
          modal={false}
          canSelectParent={true}
          categoryId={choosing.value.id}
          categoryIsParent={choosing.value.isParent}
          onSelect={choosing.onSelect}
          onCancel={choosing.onCancel}
        />
      ) : null}
      {choosing.type === CHOOSING_TYPES.accountOrGroup ? (
        <AccountGroupChoice
          current={choosing.value}
          onSelect={choosing.onSelect}
          onCancel={choosing.onCancel}
        />
      ) : null}
    </>
  )
}

const InfoSlide = ({
  doc,
  fieldSpecs,
  fieldOrder,
  fieldLabels,
  onRequestChooseField,
  onChangeField
}) => {
  return (
    <ModalSections>
      {fieldOrder.map(fieldName => {
        const FieldSection = SectionsPerType[fieldSpecs[fieldName].type]
        const fieldSpec = fieldSpecs[fieldName]
        const fieldLabel = fieldLabels[fieldName]
        return (
          <FieldSection
            key={fieldName}
            label={fieldLabel}
            value={fieldSpec.getValue(doc)}
            onClick={
              fieldSpec.immediate ? null : () => onRequestChooseField(fieldName)
            }
            onChange={
              fieldSpec.immediate
                ? ev => {
                    onChangeField(fieldName, ev.target.value)
                  }
                : null
            }
          />
        )
      })}
    </ModalSections>
  )
}

const INFO_SLIDE_INDEX = 0
const CHOOSING_SLIDE_INDEX = 1

const EditionModal = props => {
  const {
    fieldSpecs,
    fieldLabels,
    fieldOrder,
    initialDoc,
    modalTitle,
    okButtonLabel,
    cancelButtonLabel,
    onEdit,
    onDismiss
  } = props
  const [doc, setDoc] = useState(initialDoc)
  const [choosing, setChoosing] = useState(null)

  const handleChoosingCancel = () => {
    setChoosing(null)
  }

  const handleChangeField = (name, val) => {
    const updater = fieldSpecs[name].updater
    const updatedDoc = updater(doc, val)
    setDoc(updatedDoc)
  }

  const handleRequestChooseField = name => {
    const fieldSpec = fieldSpecs[name]
    setChoosing({
      type: fieldSpec.type,
      value: fieldSpec.getValue(doc),
      onSelect: val => {
        setChoosing(null)
        handleChangeField(name, val)
      },
      onCancel: handleChoosingCancel
    })
  }

  const handleConfirmEdit = () => {
    onEdit(doc)
  }

  return (
    <Modal title={modalTitle} mobileFullscreen={true} dismissAction={onDismiss}>
      <Stepper
        showPercentage={false}
        currentIndex={choosing ? CHOOSING_SLIDE_INDEX : INFO_SLIDE_INDEX}
        onBack={() => setChoosing(null)}
      >
        <InfoSlide
          doc={doc}
          fieldOrder={fieldOrder}
          fieldSpecs={fieldSpecs}
          fieldLabels={fieldLabels}
          onRequestChooseField={handleRequestChooseField}
          onChangeField={handleChangeField}
        />
        <div>{choosing ? <ChoosingSwitch choosing={choosing} /> : null}</div>
      </Stepper>
      <ModalFooter>
        <ModalButtons>
          <Button
            theme={'secondary'}
            onClick={onDismiss}
            label={cancelButtonLabel(props, doc)}
          />
          <Button onClick={handleConfirmEdit} label={okButtonLabel(doc)} />
        </ModalButtons>
      </ModalFooter>
    </Modal>
  )
}

export default EditionModal
