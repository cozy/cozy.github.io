import React, { useRef, useState } from 'react'
import PropTypes from 'prop-types'

import { makeStyles } from 'cozy-ui/transpiled/react/styles'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import ActionMenu, {
  ActionMenuItem,
  ActionMenuRadio
} from 'cozy-ui/transpiled/react/deprecated/ActionMenu'
import DropdownText from 'cozy-ui/transpiled/react/DropdownText'
import InputGroup from 'cozy-ui/transpiled/react/InputGroup'

import { trackEvent } from 'ducks/tracking/browser'

const useStyles = makeStyles({
  mobileInput: {
    width: '100%',
    maxWidth: 'none',
    border: '0',
    '&:hover, &:focus, &:active': {
      border: '0'
    }
  },
  desktopInput: {
    height: '2.5rem',
    borderRadius: '1.25rem',
    flex: '0'
  },
  mobileButton: {
    boxSizing: 'border-box',
    padding: '.625rem .5rem',
    lineHeight: '1.25rem',
    whiteSpace: 'nowrap',
    '& span, & p': {
      display: 'inline'
    }
  },
  desktopButton: {
    boxSizing: 'border-box',
    margin: '-.063rem',
    padding: '.625rem 1rem',
    borderRadius: '1.25rem',
    lineHeight: '1.25rem',
    whiteSpace: 'nowrap',
    '& span, & p': {
      display: 'inline'
    }
  }
})

const SelectInput = ({ options, name, value, setValue }) => {
  const { isMobile } = useBreakpoints()
  const styles = useStyles()
  const [isOpened, setIsOpened] = useState(false)

  const anchorRef = useRef()

  const handleClick = () => {
    trackEvent({ name: 'tri' })
    setIsOpened(true)
  }

  return (
    <InputGroup className={isMobile ? styles.mobileInput : styles.desktopInput}>
      <DropdownText
        className={isMobile ? styles.mobileButton : styles.desktopButton}
        variant="caption"
        onClick={handleClick}
        ref={anchorRef}
      >
        {options[value]}
      </DropdownText>
      {isOpened && (
        <ActionMenu
          className={styles.menu}
          anchorElRef={anchorRef}
          autoclose={true}
          onClose={() => setIsOpened(false)}
        >
          {Object.entries(options).map(([optionValue, optionLabel]) => {
            return (
              <ActionMenuItem
                key={optionValue}
                left={
                  <ActionMenuRadio
                    name={name}
                    value={optionValue}
                    checked={optionValue === value}
                  />
                }
                onClick={() => setValue(optionValue)}
              >
                {optionLabel}
              </ActionMenuItem>
            )
          })}
        </ActionMenu>
      )}
    </InputGroup>
  )
}

SelectInput.propTypes = {
  options: PropTypes.objectOf(PropTypes.string),
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  setValue: PropTypes.func.isRequired
}

export default SelectInput
