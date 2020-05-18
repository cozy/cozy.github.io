/**
 * Due to legacy some io.cozy.account need a little cleaning.
 * This watch every account and update it if needed.
 */
const { isEqual } = require('lodash')

const DOCTYPE_COZY_ACCOUNTS = 'io.cozy.accounts'
const DOCTYPE_COZY_FILES = 'io.cozy.files'
const DOCTYPE_COZY_TRIGGERS = 'io.cozy.triggers'

const findTriggerByAccount = async (client, accountId) => {
  const index = await client.data.defineIndex(DOCTYPE_COZY_TRIGGERS, [
    'message.account'
  ])
  const results = await client.data.query(index, {
    selector: {
      message: {
        account: {
          $eq: accountId
        }
      }
    }
  })
  return results[0]
}

const findFolder = async (client, folderId) => {
  return await client.files.statById(folderId)
}

// Check for outdated legacy attributes

// dir_id is an old attribute which was still added on updates
const fixAccountDirId = (account, dryRun = true) => {
  const sanitizedAccount = { ...account }
  if (typeof account.dir_id === 'undefined') {
    console.log('✅  No attribute `dir_id`')
  } else if (dryRun) {
    console.info(`👌  Would remove \`dir_id\` from ${account._id}`)
  } else {
    console.info(`👌  Removing \`dir_id\` from ${account._id}`)
    delete sanitizedAccount.dir_id
  }
  return sanitizedAccount
}

// folderId is a deprecated attribute. This information is now stored
// directly in the trigger document
const fixAccountFolderId = (account, dryRun = true) => {
  const sanitizedAccount = { ...account }
  if (typeof account.folderId === 'undefined') {
    console.log('✅  No attribute `folderId`')
  } else if (dryRun) {
    console.info(`👌  Would remove \`folderId\` from ${account._id}`)
  } else {
    console.info(`👌  Removing \`folderId\` from ${account._id}`)
    delete sanitizedAccount.folderId
  }
  return sanitizedAccount
}

// Misplaced folderPath
const fixAccountFolderPath = (account, dryRun = true) => {
  const sanitizedAccount = { ...account }
  if (typeof account.folderPath === 'undefined') {
    console.log('✅  No attribute `folderPath` in account root')
  } else {
    if (!account.auth) {
      sanitizedAccount.auth = {}
    }
    if (!account.auth || typeof account.auth.folderPath === 'undefined') {
      if (dryRun) {
        console.info(
          `👌  Would move \`folderPath\` from ${account._id} to \`auth.folderPath\``
        )
      } else {
        console.info(
          `👌  Moving \`folderPath\` from ${account._id} to \`auth.folderPath\``
        )
        sanitizedAccount.auth.folderPath = sanitizedAccount.folderPath
        delete sanitizedAccount.folderPath
      }
    } else {
      console.log(
        '❌  Conflict between `folderPath` and `auth.folderPath`, keeping `auth.folderPath`'
      )
      if (dryRun) {
        console.info(`👌  Would remove \`folderPath\` from ${account._id}`)
      } else {
        console.info(`👌  Removing \`folderPath\` from ${account._id}`)
        delete sanitizedAccount.folderPath
      }
    }
  }
  return sanitizedAccount
}

// Consistency between auth.folderPath and auth.namePath
// auth.folderPath must contains auth.namePath as last segment
const fixAccountFolderPathConsistency = async (
  client,
  account,
  dryRun = true
) => {
  const sanitizedAccount = { ...account }
  if (account.auth) {
    sanitizedAccount.auth = { ...account.auth }
    const {
      accountName,
      email,
      folderPath,
      identifier,
      login,
      namePath
    } = account.auth

    let actualFolderPath = folderPath

    if (!actualFolderPath) {
      // Get related trigger
      const trigger = await findTriggerByAccount(client, account._id)
      if (trigger) {
        if (trigger.message && trigger.message.folder_to_save) {
          // Get related folder
          const folder = await findFolder(
            client,
            trigger.message.folder_to_save
          )
          // folderPath
          if (folder) {
            console.log(
              `❌  Account ${account._id} does not contain \`auth.folderPath\` attribute`
            )

            actualFolderPath = folder.attributes.path
            if (dryRun) {
              console.info(
                `👌  Would update \`auth.folderPath\` to ${actualFolderPath} in ${account._id}`
              )
            } else {
              console.info(
                `👌  Updating \`auth.folderPath\` to ${actualFolderPath} in ${account._id}`
              )
              sanitizedAccount.auth.folderPath = actualFolderPath
            }
          } else {
            console.log(
              `❌  Account ${account._id}'s trigger is not related to any existing folder\n\r`
            )
            return
          }
        } else {
          console.log(
            `✅  No attribute \`folderPath\` in account ${account._id} but related trigger ${trigger._id} does not contain \`message.folder_to_save\`\n\r`
          )
          return sanitizedAccount
        }
      } else {
        console.log(
          `❌  Account ${account._id} is not related to any trigger\n\r`
        )
        return sanitizedAccount
      }
    }

    let sanitizedNamePath = namePath

    if (!sanitizedNamePath) {
      sanitizedNamePath = accountName || login || identifier || email || ''

      sanitizedNamePath = sanitizedNamePath.replace(
        /[&/\\#,+()$@~%.'":*?<>{}]/g,
        '_'
      )

      if (sanitizedNamePath) {
        if (dryRun) {
          console.info(
            `👌  Would create \`auth.namePath\` with value ${sanitizedNamePath}`
          )
        } else {
          console.info(
            `👌  Creating \`auth.namePath\` with value ${sanitizedNamePath}`
          )
          sanitizedAccount.auth.namePath = sanitizedNamePath
        }
      }
    }
    const segments = actualFolderPath.split('/')
    if (segments[segments.length - 1] === sanitizedNamePath) {
      console.log('✅  `auth.folderPath` is consistent with `namePath`')
    } else {
      const sanitizedFolderPath = `${actualFolderPath}${
        sanitizedNamePath &&
        actualFolderPath[actualFolderPath.length - 1] !== '/'
          ? '/'
          : ''
      }${sanitizedNamePath}`

      if (dryRun) {
        console.info(
          `👌  Would update \`auth.folderPath\` to ${sanitizedFolderPath} in ${account._id}`
        )
      } else {
        console.info(
          `👌  Updating \`auth.folderPath\` to ${sanitizedFolderPath} in ${account._id}`
        )
        sanitizedAccount.auth.folderPath = sanitizedFolderPath
      }
    }
  } else {
    console.log(
      `❌  Account ${account._id} does not contain \`auth\` attribute`
    )
  }

  return sanitizedAccount
}

const fixAccount = async (client, account, dryRun = true) => {
  console.log(
    `🔍  ${client._url}: Account ${account._id} (${
      account.account_type ? account.account_type : 'unknow account_type'
    })`
  )

  let sanitizedAccount = { ...account }

  for (const fixer of [
    fixAccountDirId,
    fixAccountFolderId,
    fixAccountFolderPath
  ]) {
    sanitizedAccount = fixer(sanitizedAccount, dryRun)
  }

  sanitizedAccount = await fixAccountFolderPathConsistency(
    client,
    sanitizedAccount,
    dryRun
  )

  if (!isEqual(account, sanitizedAccount)) {
    if (dryRun) {
      console.info(`👌  Would update ${account._id}`)
    } else {
      console.info(`👌  Updating ${account._id}`)
      await client.data.update(DOCTYPE_COZY_ACCOUNTS, account, sanitizedAccount)
    }
  }

  console.log()
}

const fixAccounts = async (url, client, dryRun = true) => {
  console.log(`\n\r🔧  Running fixAccounts on ${url}\n\r`)

  let accounts
  try {
    const index = await client.data.defineIndex(DOCTYPE_COZY_ACCOUNTS, ['_id'])
    accounts = await client.data.query(index, {
      selector: { _id: { $gt: null } }
    })
  } catch (error) {
    console.log(
      `💀  Fetch error, probably due to unaccepted Term of services (${error})`
    )
    return
  }

  for (let account of accounts) {
    await fixAccount(client, account, dryRun)
  }
}

let client
module.exports = {
  getDoctypes: function() {
    return [DOCTYPE_COZY_ACCOUNTS, DOCTYPE_COZY_TRIGGERS, DOCTYPE_COZY_FILES]
  },
  run: async function(ach, dryRun = true) {
    client = ach.client

    await fixAccounts(ach.url, client, dryRun).catch(x => {
      console.log(x)
    })
  },
  fixAccount
}
