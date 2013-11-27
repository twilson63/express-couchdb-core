var express = require('express');
var app = express();
var nano = require('nano');
var _ = require('underscore');

var agentkeepalive = require('agentkeepalive');
var myagent = new agentkeepalive({
    maxSockets: 50
  , maxKeepAliveRequests: 0
  , maxKeepAliveTime: 30000
  });

module.exports = function(config) {
  
  var db = nano({ 
    url: config.couch,
    request_defaults: { agent: myagent} 
  });

  // create document with model type
  app.post('/api/:model', function(req, res) {
    req.body.type = req.params.model;
    db.insert(req.body, function(err, body) {
      if (err) { res.send(500, err); }
      res.send(body);
    });
  });

  // list document by model type
  app.get('/api/:model', function(req, res) { 
    db.view('model', 'all', { 
      key: req.params.model
      }, function(err, body) {
        if (err) { res.send(500, err); }
        res.send(_(body.rows).pluck('value'));
    });
  });

  // get single document by id
  app.get('/api/:model/:id', function(req, res) {
    // get parent and children docs
    db.view('model', 'get', {
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
    db.insert(req.body, req.params.id, function(err, body) {
      if (err) { res.send(500, err); }
      res.send(body);
    });
  });

  // delete single document by id
  app.del('/api/:model/:id', function(req, res) {
    db.destroy(req.params.id, req.body._rev, function(err, body) {
      if (err) { res.send(500, err); }
      res.send(body);
    });
  });

  return app;
};

