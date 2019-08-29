#!/usr/bin/env node
/* eslint-disable no-console */

const merge = require('lodash/merge')
const sortBy = require('lodash/sortBy')
const path = require('path')
const fs = require('fs')

const files = process.argv
  .slice(2)
  .map(filePath => require(path.join(__dirname, filePath)))

if (files.length === 0) {
  console.error(
    'Command usage : ./merge.js file1.json file2.json ... fileN.json'
  )
  process.exit(1)
}

const merged = merge(...files)
merged['io.cozy.bank.operations'] = sortBy(
  merged['io.cozy.bank.operations'],
  o => o.date
)

const filePath = path.join(__dirname, 'operations-merged.json')
fs.writeFileSync(filePath, JSON.stringify(merged, null, 2))

console.log(`Files merged in ${path.join(__dirname, 'operations-merged.json')}`)
