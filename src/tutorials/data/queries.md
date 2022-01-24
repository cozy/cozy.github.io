# Queries

## Basic concepts

The database used in Cozy to store and manipulate data is [CouchDB](https://docs.couchdb.org/en/2.3.1/). This is a document-oriented NoSQL database, which means that data is represented as key-value JSON documents.

A basic CouchDB document looks like this:

```json
{
  "_id": "6f978dbdc5e2424bfdec911f28005970",
  "_rev": "1-58b3a91cd89a6a2b607721f944bb6aeb",
  "book": {
    "name": "The Greatest Book"
  }
}
```

The `_id` and `_rev` fields are mandatory for each document and automatically handled by CouchDB, so the developers don’t have to worry about them. `_id` is the unique identifier of the document while `_rev` is the version number, incremented for each update. See [here](./advanced.md#revisions) to know more about the revision system.

Any field can be specified in a CouchDB document (except for fields starting with a `_`, that are reserved), as long as the JSON is valid and the type is [supported](https://docs.couchdb.org/en/stable/api/basics.html#json-basics), i.e. Array, Object, String, Number, Boolean.

CouchDB comes with two query systems to retrieve documents:

1. [Mango queries](https://docs.couchdb.org/en/2.3.1/api/database/find.html), a declarative JSON syntax
2. [Views](https://docs.couchdb.org/en/2.3.1/api/ddoc/views.html), to run arbitrary complex map-reduce functions

In Cozy, we chose to support the simpler and more efficient Mango system by default, even though views are used in specific cases.

ℹ️ CouchDB is an HTTP server. Therefore, all the requests made to the database must be expressed as HTTP requests. Any HTTP client can be used to directly query CouchDB ([curl](https://curl.haxx.se/), [request](https://github.com/request/request), [Insomnia](https://insomnia.rest/) to name a few). In Cozy, the back-end server, [cozy-stack](https://docs.cozy.io/en/cozy-stack/), communicates with CouchDB.

ℹ️ In CouchDB, you organize data in DocTypes, a data structure meant to group documents together. All documents with the same DocType are stored in a dedicated database. Thus, each database has its own documents and indexes: when performing a query, one must indicates the target database; there is no cross-databases queries capability in CouchDB, altough there is a [relationship](https://docs.cozy.io/en/cozy-doctypes/docs/#relationships) query system to overcome this. See [here](./doctypes.md) for the DocTypes documentation.

## Mango queries

The mango query system was introduced in [CouchDB 2.0](https://blog.couchdb.org/2016/08/03/feature-mango-query/) and offers a declarative JSON syntax to perform queries on documents, inspired from MongoDB.

There are several important concepts to grasp in order to efficiently use mango queries. Here, we give an overview of those concepts and detail common mistakes to avoid.

### Mango queries with cozy-client

[cozy-client](https://github.com/cozy/cozy-client) is a JavaScript library developed by Cozy Cloud that helps to query data to the Cozy back-end, [cozy-stack](https://docs.cozy.io/en/cozy-stack/), without having to manually deal with authentication, index creation, pagination, etc. In the following, we provide cozy-client examples each time we introduce a new concept. If you are not familiar with it, this [tutorial](https://docs.cozy.io/en/cozy-client/getting-started/) is a good starting place.
However, if for some reasons you do not want to use cozy-client, it is possible to make queries on your own by directly requesting the [cozy-stack data API](https://docs.cozy.io/en/cozy-stack/data-system/).

In cozy-client, each query is defined as a [Query Definition](https://docs.cozy.io/en/cozy-client/api/cozy-client/#QueryDefinition). This API is helpful to easily chain Mango concepts (selectors, sorts, indexing, …), as we will see in the following sections.

In the following, we assume a DocType named `io.cozy.todos` describing Todo lists.

Here is a basic example of a cozy-client query returning all the Todo lists in a Cozy:

```javascript
const docs = await client.queryAll(Q("io.cozy.todos"));
```

In this example, the `QueryDefinition` defines the query to get all the documents stored in the Todos database, expressed through `find("io.cozy.todos")`.

## Selectors

To use the Mango query system, you define a `selector`, expressing criterias to filter the documents to return.

### Selectors with cozy-client

With cozy-client, a selector is added to the query definition with the [`where`](https://docs.cozy.io/en/cozy-client/api/cozy-client/#querydefinitionwhereselector-querydefinition) method. It takes into input an object with the selector expression. For instance, this query means “the todos in 'sport’ category AND a title ‘Exercices’”:

```javascript
const queryDef = Q("io.cozy.todos").where({
  category: "sport",
  title: "Exercices",
});
```

`find` targets the Todos database, while `where` filters the documents to return.

ℹ️ When running this query, an index will automatically be created on the `category` and `title` fields. It is highly recommended to read the [index section](#index-fields) to avoid designing poorly efficient queries (see also [the section on mango performances](#mango-performances)).

ℹ️ The `$eq` and `$and` operators are implicit by default. It allows to write concise queries. Here is the explicit version of the previous query:

```javascript
const queryDef = client
  .find("io.cozy.todos")
  .where({
    "$and": [
      {
        "category": {
          "$eq": "sport"
      },
      {
        "title": {
          "$eq": "Exercices"
        }
      }
    ]
  })
```

### Mango operators

There are two kinds of mango operators:

- [Condition operators](https://docs.couchdb.org/en/2.3.1/api/database/find.html#condition-operators) (`$eq`, `$gt`, `$lt`, …)
- [Combinaison operators](https://docs.couchdb.org/en/2.3.1/api/database/find.html#combination-operators) (`$and` , `$or`, `$not`, …)

For more details and examples of selectors, you can directly read the [CouchDB documentation](https://docs.couchdb.org/en/2.3.1/api/database/find.html#selector-syntax).

### Mango performances

Depending on your queries and their complexity, performances can be dramatically impacted, by serveral orders of magnitude, especially for large databases, i.e. starting for thousands of documents.
It is highly recommended to take some time to understand how to [index fields](#index-fields) and the related [performances](./advanced.md#indexes-performances-and-design).

## Index fields

In order to efficiently filter documents through selectors and sort them, it is important to correctly index data. An index is a way to organize documents in order to retrieve them faster.

Most often, you will need to index fields to query data efficiently. Otherwise, the documents filtering will be processed by CouchDB through a full scan, i.e. fetching all the database documents and performing the selector in memory. This can be very time-consuming when the database grows. In some cases, it can even prevent the query to be run. Thus, when an index is required, **any field involved in a selector should be indexed**.

ℹ️ It is not always necessary to index fields to filter data. For instance, let's assume you want all the folders inside a sub-folder, but not the trash (which is a special folder with a fixed `_id`). You should index the `type` (to exclude files) and `dir_id` (to specifiy this specific sub-folder), but you should not index the `_id` (to exclude the trash): this can easily be done on the application level. Here, indexing `_id` would make the index grows unnecessarily and impact the database performances.

⚠️ Maintaining a lot of indexes is costful for the database: you should think careful about your queries and re-use existing index when possible.

⚠️ cozy-client automatically indexes fields declared in a `where` call. However, this currently only works for simple queries with implicit combinaison operators, i.e. where all the fields are declared at the first level of the object. For any query involving explicit operators, you can use the [`indexFields`](https://docs.cozy.io/en/cozy-client/api/cozy-client/#QueryDefinition+indexFields) method, see below for an example.

Here, we explain how you can index fields to efficiently query documents. If you are interested on why indexing is important and how your performances can dramatically vary, you can go to the advanced explanations [here](./advanced.md#indexes-performances-and-design).

With mango queries, it is required to index documents fields that are necessary to run the queries, either because they are involved in the selector or the sort.

### Index with cozy-client

With cozy-client, you don't have to deal with the index creation: it is expressed through `indexFields`:

```javascript
const queryDef = client
  .find("io.cozy.todos")
  .where({
    category: "sport",
  })
  .indexFields(["category"]);
```

Thanks to this, cozy-client automatically creates an index on `category` before running the query for the first time and explicity tell CouchDB to use it.

💡 In this example, the `indexField` method is not mandatory: cozy-client is smart enough to automatically index `category` as it is involved in the selector. However, this automatic indexing only works for simple queries, thus, it is encouraged to explicity declare which fields to index.

⚠️ CouchDB evaluates if a new document should be indexed by checking if its fields match an existing index. It means that **all the indexed fields must exist in the document** to index it. It can be problematic for queries that needs to check if a particular field exists or not. We detail this behaviour and workarounds in the ["why is my document not retrieved" section](./advanced.md#indexes-why-is-my-document-not-being-retrieved).

ℹ️ If no index is used to run the query, the query response will include a `warning: no matching index found, create an index to optimize query time`. It means that your index is not properly defined, probably because some fields involved in the `where` selector are not indexed. Note that if you use a `sortBy`, you also need to index the fields involved, as explained in [this section](#sort-data).

### Index update

CouchDB updates the Mango indexes when the data is read, but not on writes. This implies that if one creates an index and inserts documents, the index will never be updated until a `find` query on these documents is performed.

⚠️ This implies that a query performed after many writes can take a certain time to complete, as it will update the index before returning any result. Likewise, the first query after an index creation will include the index build. Hence, developers should keep this behaviour in mind when designing applications and typically might need to handle query latency.

ℹ️ Starting from CouchDB 3.0.0, a [background indexing](https://docs.couchdb.org/en/stable/config/indexbuilds.html) is implemented. It aims to avoid this latency by forcing the index to update in background after writes.

### Index with several fields

Here is how to declare a query asking for todos having a “work” category and a creation date starting from 2019:

```javascript
const queryDef = client
  .find("io.cozy.todos")
  .where({
    "$and": [
      {
        "created_at": {
          "$gt": "2019-01-01"
      },
      {
        "category": "work"
      }
    ]
  })
  .indexFields(["category", "created_at"])
```

⚠️ The order in the `indexFields` array can be very important for performances, especially when there are both range and equality operators: you must always index the field involved in the equality operator first. This is further explained in [this section](advanced.md/#indexes-performances-and-design).

## Sort data with Mango

It is possible to express the order of the documents returned by a query, by using the `sort` array.

The sort is always done on a document field, by ascending (`asc`) or descending (`desc`) order, ascending being the default. It is possible to specify several fields to sort, by following this structure for each field:

`{"fieldName": "asc"|"desc"}`

For instance:

`[{"category": "asc"}, {"created_at": "asc"}]`

Here, the returned documents will be first sorted by category, and then by creation date.

⚠️ It is not possible to mix the sort order on different fields, i.e. all the fields involved in the sort must be either `asc`, either `desc` but not a mix of both.

See [this section](#sort-in-couchdb) for more info about the sort order on data types.

### Sort with cozy-client

With cozy-client, a sort is expressed through the `sortBy` method. It takes as argument an array containing the fields to sort and the direction. For instance:

```javascript
const queryDef = client
  .find("io.cozy.todos")
  .where({
    category: "sport",
  })
  .indexFields(["category", "created_at"]).sortBy[
  ({ category: "asc" }, { created_at: "asc" })
];
```

⚠️ If the fields involved in the `sortBy` are not indexed, this will force CouchDB to make the sort in memory: this can be acceptable if the query returns few documents, but it is not efficient for large queries.

⚠️ At least one of the sort fields must be included in the `where` selector. If you create an index on `category` and query it to sort on it, but with no `where` selector, the index won't be used.

⚠️ If several fields are indexed, their order is important: the sort order must follow the indexed fields order. In this example, we index `category` and `created_at` in this order: by doing so, it is not possible to sort only on `created_at`. We would need to index `created_at` first to achieve this, but this is not recommended for performances, as explained in [this section](advanced.md#indexes-performances-and-design).
See also the examples provided in the [PouchDB documentation](https://pouchdb.com/guides/mango-queries.html#more-than-one-field).

⚠️ Be aware that cozy-client sort documents too after a query using `sortBy` but, for now, with a different sorting logic than couchDB. [See this cozy-client issue](https://github.com/cozy/cozy-client/issues/790) for more informations

## Pagination

When dealing with queries returning a lot of documents, e.g. thousands, it might be necessary to paginate the results to avoid huge network payloads and having to load everything in memory, both on the server and client sides.

The pagination consists of splitting the results in “pages”: if a query matches 100.000 documents, one can paginate it, for example by actually running 1000 queries returning 100 documents each.
By doing so, the server only keeps 100 documents in memory for each query, and the client can control the data flow, for example, by implementing a “Load more” button that actually runs a paginated query and loads the 100 next documents.

With mango queries, the recommended method to paginate is through the `bookmark` parameter, that works exactly as it name suggests: it consists of a string returned by CouchDB that corresponds to the page position in the index. Just like an actual bookmark is used to mark a particular page in a book.

With cozy-client, we can use the [`offsetBookmark`](https://docs.cozy.io/en/cozy-client/api/cozy-client/#querydefinitionoffsetbookmarkbookmark-querydefinition) method to paginate:

```javascript
const docs = [];
let resp = { next: true };
while (resp && resp.next) {
  resp = await client.query(
    Q("io.cozy.todos").limitBy(200).offsetBookmark(resp.bookmark)
  );
  docs.push(...resp.data);
}
```

ℹ️ By default, cozy-client has a limit of 100 documents per query, you can calibrate it thanks to the [`limitBy`](https://docs.cozy.io/en/cozy-client/api/cozy-client/#querydefinitionlimitbylimit-querydefinition) method.

ℹ️ There is a hard limit per query enforced in the cozy-stack to avoid memory leaks. Currently, this limit is set to [1000](https://github.com/cozy/cozy-stack/blob/331f6f39402dc7ec38ecf2f5ff408a1b5cf3d730/pkg/consts/consts.go#L71).

ℹ️ The `next` parameter provided in the `query` response is handled by cozy-client and is set to `true` when it detects that there are more pages to fetch.

### Get them all!

When pagination is not required by the client, cozy-client offers the [`queryAll`](https://docs.cozy.io/en/cozy-client/api/cozy-client/#cozyclientqueryallquerydefinition-options-array) method:

```javascript
const docs = await client.queryAll(Q("io.cozy.todos"));
```

Note that it will actually automatically paginate if the total number of documents to return is superior to the `limit` (100 by default): this avoids loading too many documents in memory on the server side.
However, it is possible to overcome this pagination by passing `limit: null`: in this case, cozy-client will request the [`_all_docs` endpoint](https://docs.couchdb.org/en/stable/api/database/bulk-api.html#db-all-docs) and retrieve all the documents in one query. This endpoint is automatically created by CouchDB and is actually a [view](#views) on the `_id` key.

Thus, doing this will actually query the `_all_docs` endpoint and return all the documents in one request:

```javascript
const docs = await client.query(Q("io.cozy.todos"), { limit: null });
```

⚠️ When querying this endpoint, the response includes the [design docs](https://docs.couchdb.org/en/2.3.1/ddocs/ddocs.html), which are the Mango indexes and views definitions. Those documents are automatically filtered for the paginated queries.

⚠️ This method is faster than the pagination as it avoids to make several server requests. However, if there are many documents to return, `_all_docs` queries can take a lot of time to complete and even timeout. It also consumes server resources. Hence, you should be cautious when using this route.

## Sort in CouchDB

When dealing with various types of data, the ascending sort order is the following:

- null
- booleans
- numbers
- strings: “a” &lt; “A” &lt; ”aa” &lt; “b” …
- arrays
- objects

See the [CouchDB documentation](https://docs.couchdb.org/en/2.3.1/ddocs/views/collation.html#collation-specification) for more details on the sort orders.

ℹ️ The sort order is the same for Mango queries and views.

### Comparison of strings

Comparison of strings is done using ICU which implements the Unicode Collation Algorithm, giving a dictionary sorting of keys. This can give surprising results if you were expecting ASCII ordering. Note that:

- All symbols sort before numbers and letters (even the “high” symbols like tilde, `0x7e`)
- Differing sequences of letters are compared without regard to case, so `a < aa` but also `A < aa` and `a < AA`
- Identical sequences of letters are compared with regard to case, with lowercase before uppercase, so `a < A`.

## Views

⚠️ In Cozy, we disabled by default the possibility to create views from applications. Consequently, [cozy-client](https://github.com/cozy/cozy-client) does not support view creation, because they are disabled for applications. See the [view performances](./advanced.md#views-performances) section to find out why.

[CouchDB views](https://docs.couchdb.org/en/2.3.1/ddocs/views/index.html) are another way to express queries in Cozy, used by the [cozy-stack](https://github.com/cozy/cozy-stack/blob/331f6f39402dc7ec38ecf2f5ff408a1b5cf3d730/pkg/couchdb/index.go#L48-L229). It consists of creating [map-reduce](https://en.wikipedia.org/wiki/MapReduce) functions, where the `map` is used to qualify which documents should be indexed, and the optional `reduce` can be used to compute aggregate functions on them.

Views are much more flexible than Mango queries, as the `map` is a user-defined function (UDF) that can be written in JavaScript.

For example:

```javascript
function(doc) {
  if(doc.category && doc.created_at) {
    emit(doc.category, doc.created_at);
  }
}
```

A `map` function must always produce an `emit` , with the key and the value respectively in first and second argument.

ℹ️ Behind the hoods, views are represented exactly like the Mango queries: both use [B+ Tree](./advanced.md#indexes-concepts), with values stored in the leafs.

### Query a view

Just like Mango queries, views are particularly suited for equality and range queries. See the [CouchDB documentation](https://docs.couchdb.org/en/2.3.1/api/ddoc/views.html) to know more about the API.

To find a specific document, use the `key` parameter:

`key="sport"`

To find a range, combine the `startkey` and `endkey` parameters:

`startkey="category0001"&endkey="category0009"`

ℹ️ Note these queries return the values associated to their keys, as expressed by the `emit` in the `map` function. If the whole document is required, one can emit a null value, e.g. `emit(doc.category, null)` in the view definition and pass a `include_docs: true` when querying the view.

### Usage example: references

The flexibility of the views can be useful is some specific scenarios and are used in [some use-cases](https://github.com/cozy/cozy-stack/blob/331f6f39402dc7ec38ecf2f5ff408a1b5cf3d730/pkg/couchdb/index.go#L48-L229) in cozy-stack. Typically, the [references system](https://docs.cozy.io/en/cozy-stack/references-docs-in-vfs/) implemented for the `io.cozy.files` documents allows to link other documents to a file. For example, a file can be referenced by a photo album, a bank transaction, etc.

A reference looks like this, here a file referenced by two photos albums:

```json
"referenced_by": [
  {
    "type": "io.cozy.photos.albums",
    "id": "94375086-e2e2-11e6-81b9-5bc0b9dd4aa4"
  },
  {
    "type": "io.cozy.photos.albums",
    "id": "a7375980-cf29-0138-33fe-0c1645862fd7"
  }
]
```

This \[n-n] relation is hard to express with a Mango query, so a view is defined:

```javascript
function(doc) {
  if (isArray(doc.referenced_by)) {
    for (var i = 0; i < doc.referenced_by.length; i++) {
      emit([doc.referenced_by[i].type, doc.referenced_by[i].id]);
    }
  }
}
```

Then, it is easy to get all the files referenced by a specific photo album:
`key=["io.cozy.photos.albums", "94375086-e2e2-11e6-81b9-5bc0b9dd4aa4"]`
