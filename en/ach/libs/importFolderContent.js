const { uploadFile, uploadFolderContent } = require('./utils')

// imports a tree of directories/files. This tree must be in JSON format using directory-tree module
module.exports = (client, JSONtree) => {
  console.log('Imported :')
  return Promise.all(
    JSONtree.children.map(item => {
      if (item.children) {
        // it's a folder
        return uploadFolderContent(client, item, '')
      } else {
        // it's a file
        return uploadFile(client, item, '').then(fileDoc => {
          console.log(
            `  _id: ${fileDoc._id},  file.path: /${fileDoc.attributes.name}`
          )
          return fileDoc
        })
      }
    })
  )
    .then(() => {
      console.log(`content of ${JSONtree.name} imported`)
    })
    .catch(err => {
      console.log(
        'Error when importing folder content (probably a conflict with existing data)'
      )
      throw err
    })
}
