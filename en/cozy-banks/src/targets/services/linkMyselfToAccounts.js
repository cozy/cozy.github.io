import argparse from 'argparse'
import {
  linkMyselfToAccounts,
  unlinkMyselfFromAccounts
} from 'ducks/account/services'
import { runService } from './service'

const linkMyselfToAccountsMain = async () => {
  const parser = argparse.ArgumentParser({
    description: 'Service to link myself contact to bank accounts'
  })
  parser.addArgument('mode', {
    optional: true,
    nargs: '?',
    choices: ['link', 'unlink']
  })
  const args = parser.parseArgs()
  if (args.mode === 'unlink') {
    await runService(unlinkMyselfFromAccounts)
  } else if (args.mode == 'link' || !args.mode) {
    await runService(linkMyselfToAccounts)
  }
}

linkMyselfToAccountsMain()
