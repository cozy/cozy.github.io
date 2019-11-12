import { runService } from './service'
import { runCategoryBudgetService } from 'ducks/budgetAlerts/service'

const main = () => runService(runCategoryBudgetService)

main()
