import argparse from 'argparse'
import {
  listAutoGroups,
  purgeAutoGroups,
  createAutoGroups
} from 'ducks/groups/services'
import { runService } from './service'

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
