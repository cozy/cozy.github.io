import { withClient } from 'cozy-client'
import { connect } from 'react-redux'
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
      const { client } = ownProps
      return mapValues(docSpecs, ([doctype, id]) =>
        client.hydrateDocument(client.getDocumentFromState(doctype, id))
      )
    })
  )

export default withDocs
