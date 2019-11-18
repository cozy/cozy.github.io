import { withClient } from 'cozy-client'
import { connect } from 'react-redux'
import { getDocumentFromState } from 'cozy-client/dist/store'
import mapValues from 'lodash/mapValues'
import compose from 'lodash/flowRight'

/**
 * Provides downstream components with docs from cozy-client's
 * internal state
 */
const withDocs = propToDocs =>
  compose(
    withClient,

    // TODO Put getDocumentFromState on cozy-client, this way we should not
    // have to import getDocumentFromState and react-redux's connect
    connect((state, ownProps) => {
      const docSpecs = propToDocs(ownProps)
      return mapValues(docSpecs, ([doctype, id]) =>
        ownProps.client.hydrateDocument(
          getDocumentFromState(state, doctype, id)
        )
      )
    })
  )

export default withDocs
