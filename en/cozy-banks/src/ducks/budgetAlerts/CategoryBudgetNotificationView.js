import NotificationView from 'ducks/notifications/BaseNotificationView'
import template from './template.hbs'
import { fetchCategoryAlerts } from './index'
import { buildNotificationData } from './service'
import { getCurrentDate } from 'ducks/notifications/utils'
import { getParentCategory } from 'ducks/categories/helpers'
import { getCategoryName } from 'ducks/categories/categoriesMap'
import sumBy from 'lodash/sumBy'
import logger from 'cozy-logger'

const log = logger.namespace('category-budgets')

const transformForTemplate = (budgetAlert, t) => {
  const catId = budgetAlert.alert.categoryId
  const parentCategoryId = getParentCategory(catId)
  const catName = getCategoryName(catId)
  const type = parentCategoryId === catId ? 'categories' : 'subcategories'
  return {
    ...budgetAlert.alert,
    categoryLabel: t(`Data.${type}.${catName}`),
    currentAmount: -sumBy(budgetAlert.expenses, tr => tr.amount),
    accountOrGroupLabel: 'Account or group label'
  }
}

class CategoryBudget extends NotificationView {
  constructor(options) {
    super(options)
    this.currentDate = options.currentDate
    this.force = options.force
  }

  shouldSend(templateData) {
    log('info', 'Nothing to send, bailing out')

    return !!templateData.budgetAlerts
  }

  async buildData() {
    const client = this.client
    const alerts = await fetchCategoryAlerts(client)

    const budgetAlerts = await buildNotificationData(client, alerts, {
      currentDate: this.currentDate,
      force: this.force
    })

    this.updatedAlerts = budgetAlerts && budgetAlerts.map(x => x.alert)

    if (!budgetAlerts) {
      return {}
    }

    const data = {
      date: getCurrentDate(),
      budgetAlerts: budgetAlerts
        ? budgetAlerts.map(budgetAlert =>
            transformForTemplate(budgetAlert, this.t)
          )
        : null
    }

    return data
  }

  getUpdatedAlerts() {
    if (this.updatedAlerts === undefined) {
      throw new Error(
        'Notification must have been sent before calling getUpdatedAlerts'
      )
    }
    return this.updatedAlerts
  }

  getTitle() {
    return this.t('Notifications.categoryBudgets.email.title')
  }

  getPushContent() {}
}

CategoryBudget.template = template
CategoryBudget.category = 'budget-alerts'
CategoryBudget.preferredChannels = ['mail']

export default CategoryBudget
