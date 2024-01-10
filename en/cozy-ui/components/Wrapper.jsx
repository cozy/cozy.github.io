import React, { useState } from 'react'
import CozyTheme from '../../react/providers/CozyTheme'
import Paper from '../../react/Paper'
import Button from '../../react/deprecated/Button'
import isTesting from '../../react/helpers/isTesting'
import Typography from '../../react/Typography'
import Divider from '../../react/Divider'
import { isUsingDevStyleguidist } from '../../scripts/build-utils'

const styles = {
  button: {
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
    marginRight: 0,
    zIndex: 10
  },
  buttonLang: {
    position: 'absolute',
    top: '0.75rem',
    right: '6.75rem',
    marginRight: 0,
    zIndex: 10
  },
  paper: {
    position: 'relative',
    padding: '1rem'
  }
}

export default ({ children }) => {
  const [variant, setVariant] = useState(
    localStorage.getItem('ui-theme-variant') || 'normal'
  )
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en')

  const otherVariant = variant === 'normal' ? 'inverted' : 'normal'

  const handleVariantClick = () => {
    setVariant(otherVariant)
  }

  const handleLangClick = () => {
    const newLang = lang === 'fr' ? 'en' : 'fr'
    setLang(newLang)
    localStorage.setItem('lang', newLang)
  }
  return (
    <CozyTheme>
      <CozyTheme variant={variant}>
        <Paper className="u-pos-relative u-p-1" elevation={0} square>
          <Button
            size="tiny"
            theme="secondary"
            label={lang}
            style={styles.buttonLang}
            onClick={handleLangClick}
          />
          {isTesting() || isUsingDevStyleguidist() ? null : (
            <Button
              size="tiny"
              theme="secondary"
              label={variant}
              style={styles.button}
              onClick={handleVariantClick}
            />
          )}
          {isUsingDevStyleguidist() && (
            <Typography component="div" className="u-db u-mb-1" variant="h5">
              Variant: {variant}
            </Typography>
          )}
          {children}
        </Paper>
      </CozyTheme>
      {isUsingDevStyleguidist() && (
        <>
          <Divider />
          <CozyTheme variant={otherVariant}>
            <Paper className="u-pos-relative u-p-1" elevation={0} square>
              <Typography component="div" className="u-db u-mb-1" variant="h5">
                Variant: {otherVariant}
              </Typography>
              {children}
            </Paper>
          </CozyTheme>
        </>
      )}
    </CozyTheme>
  )
}
