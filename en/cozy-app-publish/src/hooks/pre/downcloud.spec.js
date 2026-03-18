jest.mock('fs-extra')
jest.mock('./helpers')

const fs = require('fs-extra')

const downcloud = require('./downcloud')
const helpers = require('./helpers')

it('should error if the build dir does not exist', () => {
  fs.existsSync = jest.fn().mockReturnValueOnce(false)
  expect(downcloud({ buildDir: 'something/build' })).rejects.toThrow()
})

it('should use the passed build dir to generate the archive', async () => {
  fs.existsSync = jest.fn().mockReturnValueOnce(true)
  const expectedArchivePath = 'something/build/test.tar.gz'

  await downcloud({ buildDir: 'something/build', appSlug: 'test' })

  expect(helpers.deleteArchive).toHaveBeenCalledWith(expectedArchivePath)
  expect(helpers.createArchive).toHaveBeenCalledWith(expectedArchivePath)
})
