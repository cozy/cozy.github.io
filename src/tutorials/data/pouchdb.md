# PouchDB - Offline

[PouchDB](https://pouchdb.com/) is a JavaScript implementation of CouchDB. It is particulary well suited for client environments such as browsers or mobile.

ℹ️ In Cozy, PouchDB is used in the desktop client and in mobile apps to synchronize data with the CouchDB server. Having a local database enables offline support and improves performances: the client can directly query local data to avoid network latency or unavailability.

While it is meant to mimic most of the CouchDB API, there are specificities that are good to know when working with PouchDB.

The findings below were obtained while working on sorting performance in Cozy Drive. For reference, the final PR [can be seen here](https://github.com/cozy/cozy-drive/pull/1002/files).

## Understanding what's going on

Before diving into some of the quirks, it's important to understand some things when it comes to Pouchdb and especially Mango queries.
First, you can add a plugin called `pouchdb-debug` and enable extra logs with `PouchDB.debug.enable( "pouchdb:find" );`. This will add explanation about the queries you run in the console and it's very helpful to understand what's going on under the hood.

You will realize that Pouchdb operates in 2 phases: first, it loads candidate documents in memory, and then it analyzes the candidates and only keeps the relevant ones. Long story short: the larger the number of candidates, the longer the operation will take. By default, all the documents in a database are candidates, but it is possible to have fewer candidates by using an index: by combining the query and the index, PouchDB can load only a subset of all the documents and may even skip the analyze phase if the index is really well suited to the query. A more detailed guide can be found [here](https://www.bennadel.com/blog/3258-understanding-the-query-plan-explained-by-the-find-plugin-in-pouchdb-6-2-0.htm).

## About indexes

Creating an index takes some time, but the first query will _also_ take time — you are encouraged to warm up the indexes by firing a query that uses it before it is actually needed. CozyPouchLink provides a way to automatically fire those queries after replication.

```js
import fromPairs from 'lodash/fromPairs'
import CozyClient, { Q } from 'cozy-client'
import CozyStackClient from 'cozy-stack-client'
import CozyPouchLink from 'cozy-pouch-link'

const TRANSACTION_DOCTYPE = 'io.cozy.bank.operations'

const makeWarmupQueryOptions = (doctype, indexedFields) => {
  return {
    definition: () => {
      const qdef = Q(doctype)
        .where(
          fromPairs(indexedFields.map(fieldName => [fieldName, { $gt: null }]))
        )
        .indexFields(indexedFields)
      return qdef
    },
    options: {
      as: `${doctype}-by-${indexedFields.join('-')}`
    }
  }
}

const pouchLink = new CozyPouchLink({
  doctypes: [TRANSACTION_DOCTYPE],
  doctypesReplicationOptions: {
    [TRANSACTION_DOCTYPE]: {
      warmupQueries: [
        makeWarmupQueryOptions(TRANSACTION_DOCTYPE, ['date']),
        makeWarmupQueryOptions(TRANSACTION_DOCTYPE, ['account']),
        makeWarmupQueryOptions(TRANSACTION_DOCTYPE, ['date', 'account'])
      ]
    }
  },
  initialSync: true
})

const client = new CozyClient({
  links: [pouchLink, new CozyStackClient()]
})
```

ℹ️ By default, Pouch will try to find the best index to use on your query. But for advanced queries, you generally want to force it with the use_index option to be sure it does not mess up.
ℹ️ If the query and the index you force are not compatible, Pouch will emit an error and not run the query at all.
ℹ️ If there is a change in the underlying documents, the index will be partially recalculated on the next query.

## Indexing more than one field

Creating an index on several fields is _not_ the same as creating multiple indexes on one field each. The effects of a single index on multiple fields is illustrated in the [official docs](https://pouchdb.com/guides/mango-queries.html#more-than-one-field) and is important to understand.
Furthermore, the order in which fields are indexed on a multi-index is significant, most notably when it comes to sorting. If you declare an index on the fields `['name', 'age']`, you should also sort them by `['name', 'age']`. Sorting them in a different order or using other fields will likely be done in memory and kill your performance.

See this [section](./advanced.md#indexes-performances-and-design) for more details and understand how to efficiently design indexes.

## Avoiding full scan

Filtering results with a selector on a field that has not been indexed is almost guaranteed to be done through a full scan and should be avoided. Since you can't have too many indexes, some filtering may have to be done in your own code — but if you can narrow down the results beforehand, that shouldn't be a problem.

Note that even selectors on indexed field may end up being done in memory: see this [section](./advanced.md#indexes-performances-and-design) for more details and understand how to avoid memory selectors.
