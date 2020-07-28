import React from 'react'
import { useQuery } from 'cozy-client'
import Modal, {
  ModalContent,
  ModalHeader
} from 'cozy-ui/transpiled/react/Modal'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Alerter from 'cozy-ui/transpiled/react/Alerter'

import Loading from 'components/Loading'
import Padded from 'components/Spacing/Padded'
import PageTitle from 'components/Title/PageTitle'

import PersonalInfoForm from 'ducks/personal-info/Form'
import { myselfConn } from 'doctypes'

/**
 * Loads the myself contact and displays the form
 * Since the form can be displayed either in a modal or in a page,
 * the components Wrapper, Content and Header are passed as props.
 */
const PersonalInfo = ({ wrapperProps, Components, onSaveSuccessful }) => {
  const { t } = useI18n()
  const myselfCol = useQuery(myselfConn.query, myselfConn)

  const handleSaveSuccessful = updatedDoc => {
    onSaveSuccessful && onSaveSuccessful(updatedDoc)
    Alerter.success(t('PersonalInfo.info-saved-succesfully'))
  }

  const { Wrapper, Header, Content } = Components

  return (
    <Wrapper {...wrapperProps}>
      {myselfCol.data && myselfCol.data[0] ? (
        <>
          <Header>{t('PersonalInfo.modal-title')}</Header>
          <Content>
            <PersonalInfoForm
              onSaveSuccessful={handleSaveSuccessful}
              myself={myselfCol.data[0]}
            />
          </Content>
        </>
      ) : (
        <Loading />
      )}
    </Wrapper>
  )
}

const modalComponents = {
  Wrapper: Modal,
  Header: ModalHeader,
  Content: ModalContent
}

const pageComponents = {
  Wrapper: Padded,
  Header: PageTitle,
  Content: React.Fragment
}

export const PersonalInfoModal = ({ wrapperProps, ...props }) => {
  const { t } = useI18n()
  return (
    <PersonalInfo
      {...props}
      wrapperProps={{
        ...wrapperProps,
        'aria-label': t('PersonalInfo.modal-title')
      }}
      Components={modalComponents}
    />
  )
}

export const PersonalInfoPage = ({ ...props }) => {
  return <PersonalInfo Components={pageComponents} {...props} />
}
