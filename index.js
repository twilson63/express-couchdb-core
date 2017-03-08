var express = require('express');
var nano = require('nano');
var _ = require('underscore');

function handleError(res, err) {
  if (err.error === 'unauthorized') {
    return res.send(401, {error: _.pick(err, 'name', 'message')});
  } else if (err.error === 'not_found' || err.err === 'no_db_file') {
    return res.send(404, {error: _.pick(err, 'name', 'message')});
  } else {
    return res.send(500, {error: _.pick(err, 'name', 'message')});
  }
}

module.exports = function(config) {
  var app = express();

  var server, db;

  if (config.couch && !config.request_defaults ) {
    db = nano(config.couch);
  } else if (config.request_defaults) {
    server = nano({
      url: config.url,
      request_defaults: config.request_defaults
    });
    db = config.database_parameter_name || 'COUCH_DB';
  } else {
    server = nano(config.url);
    db = config.database_parameter_name || 'COUCH_DB';
  }

  function getDb(req) {
    if (typeof db === 'object') {
      return db;
    } else if (req[db]) {
      return server.use(req[db]);
    } else {
      return null;
    }
  }

  // create document with model type
  app.post('/api/:model', function(req, res) {
    req.body.type = req.params.model;
    var db = getDb(req)
    if (!db) return res.send(401, {error: {name: 'Unauthorized'}})
    db.insert(req.body, function(err, body) {
      if (err) { return handleError(res, err); }
      res.send(body);
    });
  });

  // list document by model type
  app.get('/api/:model', function(req, res) {
    var db = getDb(req)
    if (!db) return res.send(401, {error: {name: 'Unauthorized'}})
    db.view('model', 'all', {
      key: req.params.model
      }, function(err, body) {
        if (err) { return handleError(res, err); }
        res.send(_(body.rows).pluck('value'));
    });
  });

  // get single document by id
  app.get('/api/:model/:id', function(req, res) {
    // get parent and children docs
    var db = getDb(req)
    if (!db) return res.send(401, {error: {name: 'Unauthorized'}})
    db.view('model', 'get', {
      key: [req.params.model, req.params.id],
      include_docs: true
      },
      function(err, body) {
        if (err) { return handleError(res, err); }
        var doc = _.chain(body.rows)
          .pluck('doc')
          .groupBy('type')
          .value();
        var key = _.clone(_(doc[req.params.model]).first());
        _.extend(key, _.omit(doc, req.params.model));
        res.send(key);
    });
  });

  // update single document by id
  app.put('/api/:model/:id', function(req, res) {
    var db = getDb(req)
    if (!db) return res.send(401, {error: {name: 'Unauthorized'}})
    db.insert(req.body, req.params.id, function(err, body) {
      if (err) { return handleError(res, err); }
      res.send(body);
    });
  });

  // delete single document by id
  app.del('/api/:model/:id', function(req, res) {
    var db = getDb(req)
    if (!db) return res.send(401, {error: {name: 'Unauthorized'}})
    db.destroy(req.params.id, req.body._rev, function(err, body) {
      if (err) { return handleError(res, err); }
      res.send(body);
    });
  });

  return app;
};
