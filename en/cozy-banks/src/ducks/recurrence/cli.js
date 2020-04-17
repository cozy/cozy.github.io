/* eslint-disable no-console */
import fs from 'fs'
import { ArgumentParser } from 'argparse'
import { findRecurringBundles, getRulesFromConfig } from './rules'
import defaultConfig from './config.json'

const loadOperations = filename => {
  const file = fs.readFileSync(filename)
  return JSON.parse(file)['io.cozy.bank.operations']
}

const rules = getRulesFromConfig(defaultConfig)

const main = async () => {
  const parser = ArgumentParser({
    description: 'Finds recurring bundles in operations'
  })
  parser.addArgument('filename', {
    help: 'ACH file containing io.cozy.bank.operations'
  })
  const args = parser.parseArgs()
  const operations = loadOperations(args.filename)
  const bundles = findRecurringBundles(operations, rules)
  for (let bundle of bundles) {
    console.log({ categoryId: bundle.categoryId, amount: bundle.amount })
    bundle.ops.forEach(op => console.log(op.label))
  }
}

if (require.main === module) {
  main().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
