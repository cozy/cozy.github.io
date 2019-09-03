var readline = require('readline')

const askInput = question =>
  new Promise((resolve, reject) => {
    try {
      console.log(question)
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
      })

      rl.on('line', function(cmd) {
        resolve(cmd)
      })
    } catch (e) {
      reject(e)
    }
  })

// Sample config file to put in ~/.ACH.json
const SAMPLE = `
{
  "envs": {
    "dev": {
      "adminURL": "https://localhost:6062",
      "adminAuth": "USER:PASSWORD"
    },
    "int": {
      "adminURL": "https://localhost:6063",
      "adminAuth": "USER:PASSWORD"
    },
    "stg": {
      "adminURL": "https://localhost:6064",
      "adminAuth": "USER:PASSWORD"
    },
    "prod": {
      "adminURL": "https://localhost:6065",
      "adminAuth": "USER:PASSWORD"
    },
    "local": {
      "adminURL": "http://localhost:6060",
      "adminAuth": ""
    }
  }
}
`

const fs = require('fs')

let config

/**
 * Must be called prior to call getAdminConfigForDomain
 */
const loadConfig = async () => {
  const configPath = `${process.env.HOME}/.ACH.json`
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath).toString())
    } catch (e) {
      console.error(
        `Config file ${configPath} does not seem to be a valid JSON.`
      )
      throw new Error('Wrong config file')
    }
  } else {
    const answer = await askInput(
      `${configPath} does not exist, do you want to create a sample file in ${configPath}, y to say yes.`
    )
    if (answer.trim() === 'y') {
      fs.writeFileSync(configPath, SAMPLE)
      console.log(`Created ${configPath}, exiting to let you fill it...`)
      process.exit(0)
    } else {
      console.log('Did not create sample file, exiting...')
      process.exit(1)
    }
  }
}

const domainToEnv = {
  'cozy.wtf': 'dev',
  'cozy.works': 'int',
  'cozy.rocks': 'stg',
  'mycozy.cloud': 'prod',
  'tools:8080': 'local'
}

const getAdminConfigForDomain = domain => {
  const host = domain
    .split('.')
    .slice(1)
    .join('.')
  const env = domainToEnv[host]
  if (!env || !config.envs[env]) {
    throw new Error('Env not found: ' + host)
  }
  const envConfig = config.envs[env]
  return {
    adminAuth: envConfig.adminAuth,
    adminURL: envConfig.adminURL
  }
}

module.exports = {
  getAdminConfigForDomain,
  loadConfig
}
