import React from 'react'
import Modal from 'cozy-ui/transpiled/react/Modal'
import veepeeLogo from 'assets/veepee.png'
import veepeeInfo from 'assets/veepee-info.png'
import veepeeInfo2x from 'assets/veepee-info@2x.png'
import styles from './AugmentedModal.styl'

const { ModalBrandedHeader } = Modal

const modalBrandedHeaderStyle = { marginBottom: 0 }

const Side = () => (
  <>
    <a
      href="https://secure.fr.vente-privee.com/authentication/portal/FR"
      className={styles.FakeInfosLinkVendor}
      target="_blank"
      rel="noreferrer noopener"
    />
    <a
      href="https://isabelledurand-drive.mycozy.cloud/#/folder/7aadd73f48591c0df263640687052a2d"
      className={styles.FakeInfosLinkDrive}
      target="_blank"
      rel="noreferrer noopener"
    />
    <img src={veepeeInfo} srcSet={`${veepeeInfo2x} 2x`} alt="" />
  </>
)

const Header = () => (
  <ModalBrandedHeader
    bg="#eee"
    logo={veepeeLogo}
    style={modalBrandedHeaderStyle}
  />
)

export { Header, Side }
