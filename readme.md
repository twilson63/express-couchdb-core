# Express CouchDb Core

This module provides a generic restful api for accessing couchdb
documents.  By dropping this module in your express application you can
immediately start managing couchdb documents via a restful crud
interface in your single page application.  This module only includes
list, create, read, update and delete, it does not include any view or
query functionality, this has to be implemented in your express
application.

## Install

``` sh
npm install express-couchdb-core --save
// add model design and all view to couchDb
node init.js [couchdb]
```

## Usage

``` js
var core = require('express-couchdb-core');
var config = { couch: 'http://localhost:5984/foo' };
app.config(function() {
  // handle other requests first
  app.use(express.router);
  // handle core requests
  app.use(core(config));
});
```

## API

The api uses the term model to represent the document type, and it is
assumed that when you store your documents you will use the type node in
the document to represent the model type.  For example, 

``` json
{
  "_id": "123456789",
  "name": "Johnny Paper",
  "type": "person"
}
```

RESTFul call

```
GET /api/person
```

will return all documents of type "person"

### GET /api/:model ? (couch options)

Returns a list of documents of the type `:model`

### POST /api/:model

Create a document of type `:model`

### GET /api/:model/:id

Returns a couch document

### PUT /api/:model/:id

Updates an existing couch document or creates a couch document with
specific id

### DEL /api/:model/:id

Deletes a couch document

## Adding Child docs

This module comes with a feature to add child docs that can
also be pulled down with a get request from the parent as
an array in the parent node.

For Example:

POST /api/foo
``` json
{
  "_id": 1,
  "_rev": 1,
  "name": "bar",
  "type": "foo"
}
```

Next we post a child document to foo and we use the underscore
to indicate it is a child document type and use the [model]_id
to assign ownership to the parent document.

POST /api/foo_bar

``` json
{
  "_id": 2,
  "_rev": 1,
  "name": "baz",
  "type": "foo_bar",
  "foo_id": 1
}
```

This will link the document type foo_bar as a child to document
type foo.  And when you get the foo document of id 1, it will return
the foo document with a key called foo_bar: [] and the child document 
in that array.

GET /api/foo/1

``` json
{
  "_id": 1,
  "_rev": 1,
  "name": "bar",
  "type": "foo",
  "foo_bar": [{
    "_id": 2,
    "_rev": 1,
    "name": "baz",
    "type": "foo_bar",
    "foo_id": 1
  }]
}
```

you can have multiple children docs attached to a parent
doc.

## License

MIT

## Contributions

Pull Requests Welcome
