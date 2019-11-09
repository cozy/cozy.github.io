import NotificationView from 'ducks/notifications/BaseNotificationView'
import template from './template.hbs'
import { fetchCategoryAlerts, buildNotificationData } from './index'
import { getCurrentDate } from 'ducks/notifications/utils'
import { getParentCategory } from 'ducks/categories/helpers'
import { getCategoryName } from 'ducks/categories/categoriesMap'
import sumBy from 'lodash/sumBy'

const transformForTemplate = (budgetAlert, t) => {
  const catId = budgetAlert.alert.categoryId
  const parentCategoryId = getParentCategory(catId)
  const catName = getCategoryName(catId)
  const type = parentCategoryId === catId ? 'categories' : 'subcategories'
  return {
    ...budgetAlert.alert,
    categoryLabel: t(`Data.${type}.${catName}`),
    currentAmount: sumBy(budgetAlert.expenses, tr => tr.amount),
    accountOrGroupLabel: 'Account or group label'
  }
}

class CategoryBudget extends NotificationView {
  async buildData() {
    const client = this.client
    const alerts = await fetchCategoryAlerts(client)
    const budgetAlerts = await buildNotificationData(client, alerts, {
      force: true
    })

    const data = {
      date: getCurrentDate(),
      budgetAlerts: budgetAlerts.map(budgetAlert =>
        transformForTemplate(budgetAlert, this.t)
      )
    }

    return data
  }

  getTitle() {
    return 'CategoryBudget' // i18n
  }

  getPushContent() {}
}

CategoryBudget.template = template
CategoryBudget.category = 'category-budget'
CategoryBudget.preferredChannels = ['mail']
CategoryBudget.settingKey = 'CategoryBudget'

export default CategoryBudget
