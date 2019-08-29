export default function isCreatedDoc(doc) {
  return doc._rev.split('-').shift() === '1'
}
