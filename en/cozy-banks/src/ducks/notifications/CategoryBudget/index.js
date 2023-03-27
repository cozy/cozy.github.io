import sumBy from 'lodash/sumBy'
import keyBy from 'lodash/keyBy'
import merge from 'lodash/merge'

import logger from 'cozy-logger'
import { Q } from 'cozy-client'

import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'
import NotificationView from 'ducks/notifications/BaseNotificationView'
import {
  formatAmount,
  getCurrentDate,
  makeAtAttributes
} from 'ducks/notifications/helpers'
import { getCategoryName } from 'ducks/categories/categoriesMap'
import { getGroupLabel } from 'ducks/groups/helpers'
import { getAccountLabel } from 'ducks/account/helpers'

import template from 'ducks/budgetAlerts/template.hbs'
import { fetchCategoryAlerts } from 'ducks//budgetAlerts'
import {
  buildNotificationData,
  hasBudgetAlerts
} from 'ducks/notifications/CategoryBudget/utils'

const log = logger.namespace('category-budgets')

const fetchDoctypeById = async (client, doctype) => {
  const { data } = await client.query(Q(doctype))
  return keyBy(data, x => x._id)
}

const getAccountOrGroupLabelFromAlert = (
  alert,
  accountsById,
  groupsById,
  t
) => {
  if (!alert.accountOrGroup) {
    return t('AccountSwitch.all-accounts')
  } else {
    const { _id, _type } = alert.accountOrGroup
    const col = _type === ACCOUNT_DOCTYPE ? accountsById : groupsById
    const doc = col[_id]
    if (doc) {
      return _type === ACCOUNT_DOCTYPE
        ? getAccountLabel(doc, t)
        : getGroupLabel(doc, t)
    } else {
      return ''
    }
  }
}

const transformForTemplate = (budgetAlert, t, accountsById, groupsById) => {
  const catId = budgetAlert.alert.categoryId
  const catName = getCategoryName(catId)
  const type = budgetAlert.alert.categoryIsParent
    ? 'categories'
    : 'subcategories'
  const accountOrGroupLabel = getAccountOrGroupLabelFromAlert(
    budgetAlert.alert,
    accountsById,
    groupsById,
    t
  )

  return {
    ...budgetAlert.alert,
    categoryLabel: t(`Data.${type}.${catName}`),
    currentAmount: Math.round(-sumBy(budgetAlert.expenses, tr => tr.amount)),
    accountOrGroupLabel
  }
}

class CategoryBudget extends NotificationView {
  constructor(options) {
    super(options)
    this.currentDate = options.currentDate
    this.force = options.force
    this.amountCensoring = options.amountCensoring
  }

  shouldSend(templateData) {
    const willSend = !!templateData.budgetAlerts
    if (!willSend) {
      log(
        'info',
        '[🔔 notifications] CategoryBudget: Nothing to send, bailing out'
      )
    }
    return willSend
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

    const accountsById = await fetchDoctypeById(client, ACCOUNT_DOCTYPE)
    const groupsById = await fetchDoctypeById(client, GROUP_DOCTYPE)

    const alertsToShow = budgetAlerts
      ? budgetAlerts.filter(x => x.expenses)
      : null
    const data = {
      date: getCurrentDate(),
      budgetAlerts: alertsToShow
        ? alertsToShow.map(budgetAlert =>
            transformForTemplate(budgetAlert, this.t, accountsById, groupsById)
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

  getTitle(templateData) {
    const { budgetAlerts } = templateData
    const hasMultipleAlerts = hasBudgetAlerts(templateData)
    return hasMultipleAlerts
      ? this.t('Notifications.categoryBudgets.email.title-multi', {
          alertCount: budgetAlerts.length
        })
      : this.t('Notifications.categoryBudgets.email.title-single', {
          categoryLabel: budgetAlerts[0].categoryLabel
        })
  }

  getPushContent(templateData) {
    const { budgetAlerts } = templateData
    return budgetAlerts.length > 1
      ? budgetAlerts
          .map(
            alert =>
              `${alert.categoryLabel}: ${formatAmount(
                alert.currentAmount
              )}€ > ${formatAmount(alert.maxThreshold, this.amountCensoring)}€`
          )
          .join('\n')
      : `${formatAmount(
          budgetAlerts[0].currentAmount,
          this.amountCensoring
        )}€ > ${formatAmount(budgetAlerts[0].maxThreshold)}€`
  }

  getExtraAttributes() {
    return merge(super.getExtraAttributes(), {
      data: {
        route: '/analysis/categories',
        redirectLink: 'banks/#/analysis/categories'
      },
      at: makeAtAttributes('CategoryBudget')
    })
  }
}

CategoryBudget.template = template
CategoryBudget.category = 'budget-alerts'
CategoryBudget.preferredChannels = ['mobile', 'mail']

export default CategoryBudget
