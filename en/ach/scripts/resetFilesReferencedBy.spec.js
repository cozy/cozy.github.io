const { referencesToRemove } = require('./resetFilesReferencedBy')

const files = [
  {
    _id: 'f1',
    referenced_by: [{ id: 't1', type: 't' }, { id: '2', type: 't' }]
  },
  { _id: 'f2' },
  { _id: 'f3', referenced_by: [{ id: 't3', type: 't' }] },
  { _id: 'f4', referenced_by: [{ id: 't4', type: 't' }] },
  {
    _id: 'f5',
    referenced_by: [{ id: 't5', type: 't' }, { id: 't6', type: 't' }]
  }
]

describe('reset references in files', () => {
  it('should return files with references to remove', async () => {
    const refs = referencesToRemove(files)
    const expected = {
      f1: [
        { data: files[0].referenced_by[0] },
        { data: files[0].referenced_by[1] }
      ],
      f3: [{ data: files[2].referenced_by[0] }],
      f4: [{ data: files[3].referenced_by[0] }],
      f5: [
        { data: files[4].referenced_by[0] },
        { data: files[4].referenced_by[1] }
      ]
    }
    expect(refs).toEqual(expected)
  })
})
