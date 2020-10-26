import React, { useState } from 'react'
import {
  Button,
  Modal,
  ModalFooter,
  ModalButtons,
  useI18n
} from 'cozy-ui/transpiled/react'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

import Stepper from 'components/Stepper'

import { CategoryChoice } from 'ducks/categories'
import AccountGroupChoice from 'ducks/settings/CategoryAlerts/AccountGroupChoice'

import { ModalSections } from 'components/ModalSections'
import AccountOrGroupSection from './AccountOrGroupSection'
import CategorySection from './CategorySection'
import ThresholdSection from './ThresholdSection'
import NumberSection from './NumberSection'
import resultWithArgs from 'utils/resultWithArgs'
import Confirmation from 'components/Confirmation'

import { BackIcon } from 'components/BackButton'
import {
  useTrackPage,
  useTracker,
  trackParentPage
} from 'ducks/tracking/browser'

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
  <span className="u-mr-1" onClick={onClick}>
    <BackIcon color="var(--coolGrey)" />
  </span>
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
  const { t } = useI18n()
  return (
    <ModalSections>
      {fieldOrder.map(fieldName => {
        const fieldSpec = fieldSpecs[fieldName]
        const FieldSection = SectionsPerType[fieldSpec.type]
        const fieldLabel = fieldLabels[fieldName]
        const chooserProps = resultWithArgs(fieldSpec, 'chooserProps', [doc])
        const sectionProps = resultWithArgs(fieldSpec, 'sectionProps', [doc])
        const hasSelector = TYPES_WITH_SELECTOR[fieldSpec.type]
        return (
          <FieldSection
            key={fieldName}
            label={t(fieldLabel)}
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

const EditionModalFooter = props => {
  const {
    canBeRemoved,
    doc,
    onEdit,
    onRemove,
    removeModalTitle,
    removeModalDescription,
    removeButtonLabel,
    cancelButtonLabel,
    onDismiss,
    okButtonLabel
  } = props
  const { isMobile } = useBreakpoints()
  const tracker = useTracker()
  const handleConfirmEdit = () => {
    onEdit(doc)
    tracker.trackEvent({ name: 'ok' })
  }

  const handleRemove = () => {
    onRemove(doc)
    onDismiss()
    tracker.trackEvent({ name: 'supprimer' })
  }

  const handleCancel = () => {
    onDismiss()
    tracker.trackEvent({ name: 'annuler' })
  }

  const removalButton = canBeRemoved && (
    <Confirmation
      title={removeModalTitle}
      description={removeModalDescription}
      onConfirm={handleRemove}
    >
      <Button theme="danger-outline" label={removeButtonLabel(props, doc)} />
    </Confirmation>
  )

  return (
    <ModalFooter>
      <ModalButtons>
        {canBeRemoved && !isMobile ? (
          <>
            {removalButton}
            <div className="u-media-grow" />
          </>
        ) : null}
        {!canBeRemoved || (canBeRemoved && !isMobile) ? (
          <Button
            theme="secondary"
            onClick={handleCancel}
            label={cancelButtonLabel(props, doc)}
          />
        ) : null}
        {canBeRemoved && isMobile ? removalButton : null}
        <Button onClick={handleConfirmEdit} label={okButtonLabel(doc)} />
      </ModalButtons>
    </ModalFooter>
  )
}

const EditionModal = props => {
  const { t } = useI18n()
  const {
    fieldSpecs,
    fieldLabels,
    fieldOrder,
    initialDoc,
    modalTitle,
    okButtonLabel,
    cancelButtonLabel,
    removeButtonLabel,
    onEdit,
    onDismiss,
    onRemove,
    removeModalTitle,
    removeModalDescription,
    canBeRemoved,
    trackPageName
  } = props
  const [doc, setDoc] = useState(initialDoc)
  const [choosing, setChoosing] = useState(null)

  useTrackPage(trackPageName)

  const handleDismiss = () => {
    onDismiss()

    // :/ We need to set a timeout otherwise we fire the track page too soon
    // and one of the event (for example clicking on "Annuler") might be wrongly
    // included in the parent page, this is why we delay a bit the hit to the
    // parent page.
    setTimeout(() => {
      trackParentPage()
    }, 100)
  }

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

  return (
    <Modal
      title={
        <>
          {choosing ? <BackArrow onClick={() => setChoosing(null)} /> : null}
          {t(modalTitle)}
        </>
      }
      mobileFullscreen={true}
      dismissAction={handleDismiss}
      closable={!choosing}
      overflowHidden={true}
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
        <EditionModalFooter
          canBeRemoved={canBeRemoved}
          doc={doc}
          onEdit={onEdit}
          onDismiss={handleDismiss}
          onRemove={onRemove}
          removeModalTitle={removeModalTitle}
          removeModalDescription={removeModalDescription}
          removeButtonLabel={removeButtonLabel}
          cancelButtonLabel={cancelButtonLabel}
          okButtonLabel={okButtonLabel}
        />
      )}
    </Modal>
  )
}

export default EditionModal
