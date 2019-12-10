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
import NumberSection from './NumberSection'
import resultWithArgs from 'utils/resultWithArgs'

import { BackButton } from 'components/BackButton'

export const CHOOSING_TYPES = {
  category: 'category',
  accountOrGroup: 'accountOrGroup',
  account: 'account',
  threshold: 'threshold',
  number: 'number'
}

const TYPES_WITH_SELECTOR = {
  category: true,
  accountOrGroup: true,
  account: true
}

const BackArrow = ({ onClick }) => (
  <BackButton className="u-mr-1" onClick={onClick} />
)

const SectionsPerType = {
  [CHOOSING_TYPES.category]: CategorySection,
  [CHOOSING_TYPES.accountOrGroup]: AccountOrGroupSection,
  [CHOOSING_TYPES.account]: AccountOrGroupSection,
  [CHOOSING_TYPES.threshold]: ThresholdSection,
  [CHOOSING_TYPES.number]: NumberSection
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
          {...choosing.chooserProps}
        />
      ) : null}
      {choosing.type === CHOOSING_TYPES.accountOrGroup ||
      choosing.type === CHOOSING_TYPES.account ? (
        <AccountGroupChoice
          current={choosing.value}
          onSelect={choosing.onSelect}
          onCancel={choosing.onCancel}
          {...choosing.chooserProps}
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
        const chooserProps = resultWithArgs(fieldSpec, 'chooserProps', [doc])
        const sectionProps = resultWithArgs(fieldSpec, 'sectionProps', [doc])
        const hasSelector = TYPES_WITH_SELECTOR[fieldSpec.type]
        return (
          <FieldSection
            key={fieldName}
            label={fieldLabel}
            value={fieldSpec.getValue(doc)}
            onClick={
              hasSelector ? () => onRequestChooseField(fieldName) : undefined
            }
            onChange={
              hasSelector
                ? undefined
                : value => {
                    onChangeField(fieldName, value)
                  }
            }
            {...sectionProps}
            chooserProps={chooserProps}
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
      chooserProps: fieldSpec.chooserProps,
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
    <Modal
      title={
        <>
          {choosing ? <BackArrow onClick={() => setChoosing(null)} /> : null}
          {modalTitle}
        </>
      }
      mobileFullscreen={true}
      dismissAction={onDismiss}
      closable={!choosing}
    >
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
      {choosing ? null : (
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
      )}
    </Modal>
  )
}

export default EditionModal
