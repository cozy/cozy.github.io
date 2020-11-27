import PropTypes from 'prop-types'

/**
 * This is a placeholder element that can be overrided.
 * It is displayed in page headers to show which enterprise is
 * responsible for retrieving the financial data of the user
 */
const LegalMention = () => {
  return null
}

LegalMention.propTypes = {
  className: PropTypes.string
}

/**
 * This static property is useful since we must be able to know for example
 * if we need to render a wrapper around the LegalMention. When using LegalMention
 * it has to be put to true
 */
LegalMention.active = false

export default LegalMention
