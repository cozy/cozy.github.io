import React, { useState } from 'react'
import CozyTheme from '../../react/CozyTheme'
import Paper from '../../react/Paper'
import Button from '../../react/deprecated/Button'
import isTesting from '../../react/helpers/isTesting'
import themes from '../../theme/themes'
import palette from '../../theme/palette.json'
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

const ThemeLabel = ({ theme }) => {
  return (
    <Typography component="div" className="u-db u-mb-1" variant="h5">
      Theme: {theme}
    </Typography>
  )
}

const paperStyle = theme => ({
  ...styles.paper,
  backgroundColor: theme === themes.normal ? 'white' : palette.Primary['600']
})

export default ({ children }) => {
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || themes.normal
  )
  const handleClick = () => {
    setTheme(theme === themes.normal ? themes.inverted : themes.normal)
  }
  const otherThemes = Object.keys(themes).filter(v => v !== theme)
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en')
  const handleLangClick = () => {
    const newLang = lang === 'fr' ? 'en' : 'fr'
    setLang(newLang)
    localStorage.setItem('lang', newLang)
  }
  return (
    <CozyTheme>
      <CozyTheme variant={theme}>
        <Paper elevation={0} square style={paperStyle(theme)}>
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
              label={theme === themes.normal ? themes.inverted : themes.normal}
              style={styles.button}
              onClick={handleClick}
            />
          )}
          {isUsingDevStyleguidist() && <ThemeLabel theme={theme} />}
          {children}
        </Paper>
      </CozyTheme>
      {isUsingDevStyleguidist() &&
        otherThemes.map((otherTheme, i) => (
          <React.Fragment key={i}>
            <Divider />
            <CozyTheme key={otherTheme} variant={otherTheme}>
              <Paper elevation={0} square style={paperStyle(otherTheme)}>
                <ThemeLabel theme={otherTheme} />
                {children}
              </Paper>
            </CozyTheme>
          </React.Fragment>
        ))}
    </CozyTheme>
  )
}
