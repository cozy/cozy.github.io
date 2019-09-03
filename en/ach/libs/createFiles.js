const randomWords = require('random-words')
const ProgressBar = require('progress')

module.exports = async (client, path, filesCount) => {
  const { forceCreateByPath } = client.files

  const fileNames = randomWords({ exactly: filesCount })

  const bar = new ProgressBar(':bar', { total: filesCount })

  for (let i = 0; i < filesCount; i++) {
    const name = fileNames[i]
    await forceCreateByPath(`${path}/${name}.txt`, name, {
      name: `${name}.txt`,
      contentType: 'text/plain'
    })
    bar.tick()
  }
}
