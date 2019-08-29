import { flowRight as compose } from 'lodash'
import withAppsUrls from 'ducks/apps/withAppsUrls'
import withBrands from 'ducks/brandDictionary/withBrands'
import { DumbTransactionActionsProvider } from 'ducks/transactions/TransactionActionsContext'

const TransactionActionsProvider = compose(
  withAppsUrls,
  withBrands()
)(DumbTransactionActionsProvider)

export default TransactionActionsProvider
