const ProgressBar = require('progress')
const faker = require('faker')

module.exports = async (client, path, filesCount) => {
  const { forceCreateByPath } = client.files

  const bar = new ProgressBar(':bar', { total: filesCount })

  for (let i = 0; i < filesCount; i++) {
    const name = faker.datatype.uuid()
    await forceCreateByPath(`${path}/${name}.txt`, name, {
      name: `${name}.txt`,
      contentType: 'text/plain'
    })
    bar.tick()
  }
}
