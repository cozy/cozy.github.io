#!/usr/bin/env node

const path = require('path')
const fs = require('fs-extra')
const { execSync } = require('child_process')

const readConfig = () => {
  if (!process.env.OVERRIDE_CONFIG_FILE) {
    return null
  }
  return JSON.parse(fs.readFileSync(process.env.OVERRIDE_CONFIG_FILE))
}

const customizeConfigXML = function(context) {
  const xsltproc = require('xsltproc')
  const overrideConfig = readConfig()
  if (!overrideConfig) {
    console.log('No transformation file provided, skipping transformation step')
    return
  }

  const transformFilePath = path.resolve(
    path.dirname(process.env.OVERRIDE_CONFIG_FILE),
    overrideConfig.mobileConfigTransformFile
  )

  const configPath = path.resolve(__dirname, '../config.xml')
  const tmpPath = path.resolve(__dirname, '../tmp.txt')
  try {
    fs.writeFileSync(tmpPath, '')

    let [major, minor, patch, beta] = overrideConfig.fullVersion
      .split('.')
      .map(x => parseInt(x, 10))
    const versionCode = overrideConfig.fullVersion
      .split('.')
      .slice(0, 3)
      .join('.')
    const androidVersionCode = (
      major * 1000000 +
      minor * 10000 +
      patch * 100 +
      beta
    ).toString()
    const transformedContent = xsltproc.transform(
      transformFilePath,
      configPath,
      {
        output: tmpPath
      }
    )
    transformedContent.stdout.on('data', function(data) {
      console.log('xsltproc stdout: ' + data)
    })

    transformedContent.stderr.on('data', function(data) {
      console.log('xsltproc stderr: ' + data)
    })

    transformedContent.on('exit', function(code) {
      if (code === 0) {
        const config = fs.readFileSync(tmpPath, 'utf8')

        let output = config
          .toString()
          .replace('$VERSION_CODE', versionCode)
          .replace('$ANDROID_VERSION_CODE', androidVersionCode)
          .replace('$IOS_VERSION_CODE', overrideConfig.fullVersion)
          .replace('$USER_AGENT_VERSION', 'io.cozy.banks.mobile-' + versionCode)

        fs.writeFileSync(tmpPath, output)
        execSync(`xmllint --format ${tmpPath} > ${configPath}`)
      }
    })
  } catch (error) {
    console.log('error during the transform', error)
  } finally {
    fs.unlinkSync(tmpPath)
  }
}

module.exports = customizeConfigXML

if (require.main === module) {
  customizeConfigXML()
}
