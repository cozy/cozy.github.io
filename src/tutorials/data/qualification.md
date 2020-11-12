# Document qualification

A document can be qualified by adding some attributes in its metadata meant to semantically describe the document. The objective is to maintain a transversal qualification structure between doctypes, so that files, banks, notes and so on could be qualified and retrieved. Currently, only the `io.cozy.files` doctype is supported. 

A qualification model is defined [here](https://github.com/cozy/cozy-client/blob/master/packages/cozy-client/src/assets/qualifications.json): it is used to provide a set of qualifications based on documents labels, so developers don't have to worry about defining their own qualification and to ensure qualifications consistency.

Note this is not an exhaustive nor closed model and [contributions](https://github.com/cozy/cozy-client/pulls) are welcomed.

To know more about the qualification format and a description of the qualification attributes with examples, see the [metadata documentation](https://github.com/cozy/cozy-doctypes/blob/master/docs/io.cozy.files_metadata.md).

## Qualify with cozy-client

This snippet shows how to qualify an health invoice with [cozy-client](https://github.com/cozy/cozy-client/):

```js
import { models } from 'cozy-client'
const { Qualification } = models.document
const { saveFileQualification } = models.file

const qualification = Qualification.getByLabel('health_invoice')
await saveFileQualification(client, file, qualification)
```

Then, then file metadata will include the following qualification:
```json
{
  "metadata": {
    "qualification": {
      "label": "health_invoice",
      "purpose": "invoice",
      "sourceCategory": "health"
    }
  }
}
```

Note `saveFileQualification` is a cozy-client helper that can be replaced by:

```js
const qualifiedFile = Document.setQualification(file, qualification)
await client
    .collection('io.cozy.files')
    .updateMetadataAttribute(file._id, qualifiedFile.metadata)

```
