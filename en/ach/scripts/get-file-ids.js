/*

## Summary

Use this script to quickly get the ids of files.


/tmp/paths is in the form of a list of file :

```
/Administrative/Fournisseurs/Free mobile/201705_freemobile.pdf
/Administrative/Fournisseurs/EDF/EDF PARTICULIERS 2017-05-08.pdf
/Share by/Genevieve/MAIF/MAIF assurance habitation.pdf
/Share by/Genevieve/Bouygues Telecom/Bouygues Telecom 30052017.pdf
```

You'll get the result in the form

{ '/Share by/Genevieve/MAIF/MAIF assurance habitation.pdf': '3749506bd271cc6df6a16204cdc8cfb5',
  '/Share by/Genevieve/Bouygues Telecom/Bouygues Telecom 30052017.pdf': '3749506bd271cc6df6a16204cdc8b88d',
  '/Administrative/Fournisseurs/Free mobile/201705_freemobile.pdf': '4462f6a0bd8eae9ee4094adab5d2c77f',
  '/Administrative/Fournisseurs/EDF/EDF PARTICULIERS 2017-05-08.pdf': '0a9d332009336d9a749875878bc41ee3' }

## Usage

$ node # in ACH directory
> .load repl.js
> .load scripts/get-file-ids
*/

const fs = require('fs')

let client

module.exports = {
  getDoctypes: function() {
    return ['io.cozy.files']
  },

  run: async function(ach) {
    client = ach.client

    const paths = fs
      .readFileSync('/tmp/paths')
      .toString()
      .split('\n')
      .filter(x => x.length > 0)

    const result = {}
    Promise.all(
      paths.map(path =>
        client.files.statByPath(path).then(x => (result[path] = x._id))
      )
    ).then(result => {
      console.log(result)
    })
  }
}
