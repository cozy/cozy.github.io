const crypto = require('crypto')
const faker = require('faker')
const { PDFDocument } = require('pdf-lib')

const {
  uploadFileWithConflictStrategy
} = require('cozy-client/dist/models/file')
const { Q } = require('cozy-client')
const { Qualification } = require('cozy-client/dist/models/document')
const data = require('../../data/papers/data.json')
const {
  DOCTYPE_CONTACTS: CONTACTS_DOCTYPE,
  DOCTYPE_FILES
} = require('../../libs/doctypes')

const makeMetadata = (qualificationLabel, metadata) => {
  const qualification = Qualification.getByLabel(qualificationLabel)
  const newMetadata = {
    qualification,
    ...metadata
  }

  return newMetadata
}

const getOrMakeContacts = async (client, hasMultipleContact) => {
  let allContacts = []
  const numberOfContacts = hasMultipleContact ? crypto.randomInt(2, 5) : 1
  const { data: contacts } = await client.query(
    Q(CONTACTS_DOCTYPE).limitBy(numberOfContacts)
  )
  allContacts = [...contacts]

  if (contacts.length < numberOfContacts) {
    for (let i = 0; i < numberOfContacts - contacts.length; i++) {
      const { data: contact } = await client.create(CONTACTS_DOCTYPE, {
        name: { givenName: faker.name.findName() }
      })
      allContacts.push(contact)
    }
  }

  return allContacts
}

const addContactReferenceToFile = async ({
  fileCreated,
  fileCollection,
  contacts
}) => {
  const references = contacts.map(contact => ({
    _id: contact._id,
    _type: CONTACTS_DOCTYPE
  }))
  await fileCollection.addReferencedBy(fileCreated, references)
}

const makePdf = async () => {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage()
  const { width, height } = page.getSize()
  const fontSize = 16
  page.drawText(faker.lorem.paragraph(), {
    x: 50,
    y: height - 4 * fontSize,
    maxWidth: width - 100,
    size: fontSize
  })
  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

const createPapers = async (
  client,
  filesCount = 1,
  dirId = 'io.cozy.files.root-dir'
) => {
  const papersCreated = []
  const fileCollection = client.collection(DOCTYPE_FILES)

  for (let i = 0; i < filesCount; i++) {
    const pdfBytes = await makePdf()
    const { qualificationLabel, metadata, hasMultipleContact } = data[
      crypto.randomInt(0, data.length)
    ]
    const newMetadata = makeMetadata(qualificationLabel, metadata)
    const contacts = await getOrMakeContacts(client, hasMultipleContact)

    const { data: fileCreated } = await uploadFileWithConflictStrategy(
      client,
      pdfBytes,
      {
        name: `${faker.lorem.word()}.pdf`,
        dirId,
        contentType: 'application/pdf',
        metadata: newMetadata,
        conflictStrategy: 'rename'
      }
    )
    await addContactReferenceToFile({ fileCreated, fileCollection, contacts })
    papersCreated.push(fileCreated)
  }

  return papersCreated
}

module.exports = {
  getDoctypes: function() {
    return [DOCTYPE_FILES, CONTACTS_DOCTYPE]
  },
  run: async function(ach, _, params) {
    const [fileCount, dirId] = params
    const client = ach.client
    const papers = await createPapers(client, fileCount, dirId)
    console.log(`${papers.length} papers created.`)
  }
}
