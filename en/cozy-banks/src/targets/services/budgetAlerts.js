import { runService } from './service'
import { runCategoryBudgetService } from 'ducks/budgetAlerts/service'

runService(({ client }) => runCategoryBudgetService(client))
