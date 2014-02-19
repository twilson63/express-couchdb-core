var express = require('express');
var nano = require('nano');
var _ = require('underscore');

module.exports = function(config) {
  var app = express();

  var server, db;

  if (config.couch) {
    db = nano(config.couch);
  } else {
    server = nano(config.url);
    db = config.database_parameter_name || 'COUCH_DB';
  }

  function getDb(req) {
    if (typeof db === 'object') {
      return db;
    } else {
      return server.use(req[db]);
    }
  }

  // create document with model type
  app.post('/api/:model', function(req, res) {
    req.body.type = req.params.model;
    getDb(req).insert(req.body, function(err, body) {
      if (err) { return res.send(500, err); }
      res.send(body);
    });
  });

  // list document by model type
  app.get('/api/:model', function(req, res) { 
    getDb(req).view('model', 'all', { 
      key: req.params.model
      }, function(err, body) {
        if (err) { return res.send(500, err); }
        res.send(_(body.rows).pluck('value'));
    });
  });

  // get single document by id
  app.get('/api/:model/:id', function(req, res) {
    // get parent and children docs
    getDb(req).view('model', 'get', {
      key: [req.params.model, req.params.id],
      include_docs: true
      }, 
      function(err, body) {
        if (err) { res.send(500, err); }
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
    getDb(req).insert(req.body, req.params.id, function(err, body) {
      if (err) { return res.send(500, err); }
      res.send(body);
    });
  });

  // delete single document by id
  app.del('/api/:model/:id', function(req, res) {
    getDb(req).destroy(req.params.id, req.body._rev, function(err, body) {
      if (err) { return res.send(500, err); }
      res.send(body);
    });
  });

  return app;
};

