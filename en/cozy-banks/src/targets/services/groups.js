import argparse from 'argparse'
import logger from 'cozy-logger'
import omit from 'lodash/omit'
import keyBy from 'lodash/keyBy'
import { runService } from './service'
import difference from 'lodash/difference'

import { GROUP_DOCTYPE, ACCOUNT_DOCTYPE } from 'doctypes'
import {
  buildAutoGroups,
  isAutoGroup,
  getGroupAccountType
} from 'ducks/groups/helpers'

const log = logger.namespace('auto-groups')

const createAutoGroups = async ({ client }) => {
  const groups = await client.queryAll(client.all(GROUP_DOCTYPE))
  const accounts = await client.queryAll(client.all(ACCOUNT_DOCTYPE))

  const groupsByAccountType = keyBy(
    groups.filter(isAutoGroup),
    getGroupAccountType
  )
  const autoGroups = buildAutoGroups(accounts, {
    virtual: false,
    client
  })

  for (const autoGroup of autoGroups) {
    const { accountType } = autoGroup
    const existing = groupsByAccountType[accountType]
    if (existing) {
      log(
        'info',
        `Automatic group for ${accountType} accounts is already created`
      )

      const newAccounts = difference(autoGroup.accounts.raw, existing.accounts)
      if (newAccounts.length > 0) {
        log('info', `Saving ${newAccounts.length} to group ${accountType}`)
        await client.save({
          ...autoGroup,
          _rev: existing._rev,
          _id: existing._id
        })
      } else {
        log('info', `Nothing changed for group ${accountType}`)
      }
    } else {
      log(
        'info',
        `Creating automatic group for ${accountType} accounts (${
          autoGroup.accounts.target.accounts.length
        } account)`
      )
      await client.save(autoGroup)
    }
  }
}

const listAutoGroups = async ({ client }) => {
  const groups = await client.queryAll(client.all(GROUP_DOCTYPE))

  const autogroups = groups.filter(isAutoGroup)

  log(
    'info',
    `${autogroups.length} autogroups (${groups.length} groups in total)`
  )
  for (const group of autogroups) {
    log('info', `${group.label} (_id: ${group._id})`)
    for (const account of group.accounts) {
      log('info', `  ${account}`)
    }
  }
}

const purgeAutoGroups = async ({ client }) => {
  const { data: groups } = await client.query(
    client.all(GROUP_DOCTYPE, { limit: null })
  )
  let autogroups = groups.filter(isAutoGroup)

  autogroups = autogroups.map(x => omit(x, '_type'))
  const col = client.collection(GROUP_DOCTYPE)
  await col.destroyAll(autogroups)
  log('info', `Destroyed ${autogroups.length} autogroups`)
}

const autoGroupsMain = async () => {
  const parser = argparse.ArgumentParser({
    description: 'Service to create groups based on bank account types'
  })
  parser.addArgument('mode', {
    optional: true,
    nargs: '?',
    choices: ['list', 'purge', 'create']
  })
  const args = parser.parseArgs()
  if (args.mode === 'list') {
    await runService(listAutoGroups)
  } else if (args.mode == 'purge') {
    await runService(purgeAutoGroups)
  } else if (args.mode == 'create' || !args.mode) {
    await runService(createAutoGroups)
  }
}

autoGroupsMain()
