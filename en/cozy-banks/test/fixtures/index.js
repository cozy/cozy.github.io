import merge from 'lodash/merge'
import dummyjson from 'dummy-json'
import dataTpl from './unit-tests.json'
import helpers from './helpers'

const execTpl = tpl =>
  JSON.parse(
    dummyjson.parse(
      JSON.stringify(tpl),
      merge(helpers, {
        helpers: { reference: x => x }
      })
    )
  )

export default execTpl(dataTpl)
