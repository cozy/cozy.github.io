const crypto = require('crypto')
const ProgressBar = require('progress')
const faker = require('faker')

const {
  uploadFileWithConflictStrategy
} = require('cozy-client/dist/models/file')
const { Qualification } = require('cozy-client/dist/models/document')
const {
  qualifications
} = require('cozy-client/dist/assets/qualifications.json')

const addQualification = () => {
  const { label } = qualifications[crypto.randomInt(0, qualifications.length)]
  const qualification = Qualification.getByLabel(label)

  return { qualification }
}

module.exports = async (client, { filesCount, dirId, qualify, mime }) => {
  const bar = new ProgressBar(':bar', { total: filesCount })

  for (let i = 0; i < filesCount; i++) {
    const name = faker.lorem.word()
    const content = faker.lorem.paragraph()
    const buffer = new Buffer.from(content, 'utf-8')

    await uploadFileWithConflictStrategy(client, buffer.toString(), {
      name,
      dirId,
      contentType: mime,
      ...(qualify ? { metadata: addQualification() } : {}),
      conflictStrategy: 'rename'
    })
    bar.tick()
  }
}
