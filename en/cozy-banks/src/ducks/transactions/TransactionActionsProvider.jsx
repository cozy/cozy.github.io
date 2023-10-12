import withAppsUrls from 'ducks/apps/withAppsUrls'
import { DumbTransactionActionsProvider } from 'ducks/transactions/TransactionActionsContext'

const TransactionActionsProvider = withAppsUrls(DumbTransactionActionsProvider)

export default TransactionActionsProvider
