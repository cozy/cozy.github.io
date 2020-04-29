import set from 'lodash/set'
import flatten from 'lodash/flatten'
import omit from 'lodash/omit'
import { dehydrate } from 'cozy-client'
import maxBy from 'lodash/maxBy'

const RECURRENCE_DOCTYPE = 'io.cozy.bank.recurrence'

const addRelationship = (doc, relationshipName, definition) => {
  return set(doc, ['relationships', relationshipName], { data: definition })
}

export const saveBundles = async (client, recurrenceClientBundles) => {
  const recurrenceCol = client.collection(RECURRENCE_DOCTYPE)
  const saveBundlesResp = await recurrenceCol.updateAll(
    recurrenceClientBundles.map(bundle => {
      const withoutOps = omit(bundle, 'ops')
      withoutOps.label = bundle.ops[0].label
      const latestOperation = maxBy(bundle.ops, x => x.date)
      withoutOps.latestDate = latestOperation.date
      return withoutOps
    })
  )
  const bundlesWithIds = recurrenceClientBundles.map((recurrenceBundle, i) => ({
    ...recurrenceBundle,
    _id: saveBundlesResp[i].id
  }))
  const ops = flatten(
    bundlesWithIds.map(recurrenceBundle =>
      recurrenceBundle.ops.map(op =>
        addRelationship(dehydrate(op), 'recurrence', {
          _id: recurrenceBundle._id,
          _type: RECURRENCE_DOCTYPE
        })
      )
    )
  )

  const opCollection = client.collection('io.cozy.bank.operations')
  await opCollection.updateAll(ops.map(op => omit(op, '_type')))
}

export const resetBundles = async client => {
  const recurrenceCol = client.collection(RECURRENCE_DOCTYPE)
  const { data: serverBundles } = await recurrenceCol.all()
  await recurrenceCol.destroyAll(serverBundles)
}
