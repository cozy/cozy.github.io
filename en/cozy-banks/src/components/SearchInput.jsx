import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import debounce from 'lodash/debounce'

import InputGroup from 'cozy-ui/transpiled/react/InputGroup'
import Input from 'cozy-ui/transpiled/react/Input'
import Icon from 'cozy-ui/transpiled/react/Icon'
import { makeStyles } from 'cozy-ui/transpiled/react/styles'
import MagnifierIcon from 'cozy-ui/transpiled/react/Icons/Magnifier'

import { trackPage } from 'ducks/tracking/browser'

const useStyles = makeStyles(theme => ({
  input: {
    borderRadius: '1.25rem',
    maxWidth: 'none',
    height: '2.5rem',
    flex: '1',
    boxShadow: theme.shadows[1],
    border: '0',
    '&:hover, &:focus, &:active': {
      border: '0',
      boxShadow: theme.shadows[6]
    },
    '& input': {
      maxWidth: 'none',
      padding: '.625rem 1rem',
      borderRadius: '1.25rem'
    }
  }
}))

const SearchInput = ({ placeholder, setValue }) => {
  const styles = useStyles()

  const delayedSetValue = useMemo(
    () => debounce(searchValue => setValue(searchValue), 375),
    [setValue]
  )

  const handleFocus = () => {
    trackPage('parametres:labels:recherche-saisie')
  }

  return (
    <>
      <InputGroup
        className={styles.input}
        prepend={
          <Icon
            className="u-pl-1"
            icon={MagnifierIcon}
            color="var(--secondaryTextColor)"
          />
        }
      >
        <Input
          placeholder={placeholder}
          onChange={event => delayedSetValue(event.target.value)}
          onFocus={handleFocus}
        />
      </InputGroup>
    </>
  )
}

SearchInput.propTypes = {
  placeholder: PropTypes.string,
  setValue: PropTypes.func.isRequired
}

export default SearchInput
