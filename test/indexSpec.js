'use strict';

var expect = require('expect.js');
var express = require('express');
var core = require('../');
var request = require('request');
var init = require('../init');

var dummyDoc = { name: 'test doc', type: 'foo'};

describe('Core Api', function() {

  describe('with normal configuration', function() {
    var db_name = 'foo';
    var app = express();
    var server;

    before(function(done) {
      request.put('http://localhost:5984/' + db_name, function() {
        // init views
        init('http://localhost:5984/' + db_name);

        app.use(express.bodyParser());
        app.use(core({
          couch: 'http://localhost:5984/' + db_name
        }));
        server = app.listen(3000);

        done();
      });

    });

    after(function(done) {
      server.close();

      request.del('http://localhost:5984/' + db_name, done);
    });

    tests(db_name);

  });

  describe('with alternate configuration', function() {
    var db_request_parameter = 'COUCH_DB_2';
    var db_name = 'foo2';
    var app = express();
    var server;

    before(function(done) {
      request.put('http://localhost:5984/' + db_name, function(e,r,b) {
        // init views
        init('http://localhost:5984/' + db_name);

        app.use(express.bodyParser());
        app.use(function(req, res, next) {
          req[db_request_parameter] = db_name;
          next();
        });
        app.use(core({
          url: 'http://localhost:5984/',
          database_parameter_name: db_request_parameter
        }));
        server = app.listen(3000);

        done();
      });
      
      
    });

    after(function(done) {
      server.close();

      request.del('http://localhost:5984/'  + db_name, done);
    });

    tests(db_name);

  });
  
  function tests(db_name) {
    // # Couch Core API
    describe('POST /api/:model', function() {
      var resp;
      it('should be ok', function(done) {
        request.post('http://localhost:3000/api/foo', {json: { name: 'bar'}}, function(e,r,b) {
          resp = b;
          expect(b.ok).to.be.ok();
          done();
        });
      });
      after(function(done) {
        request.del('http://localhost:5984/'  + db_name + "/" + resp.id + '?rev=' + resp.rev, done);
      });
    });

    describe('GET /api/:model', function() {
      var resp;
      before(function(done) {
        request.post('http://localhost:5984/foo', 
          {json: dummyDoc}, function(e,r,b) {
            resp = b;
            done();
          });
      });
      it('should return array of foo documents', function(done) {
        request.get('http://localhost:3000/api/foo', {json: true}, function(e,r,b) {
          expect(b).to.be.an('array');
          done();
        });
      });
      after(function(done) {
        request.del('http://localhost:5984/' + db_name + "/" + resp.id + '?rev=' + resp.rev, done);
      });
    });
    
    describe('GET /api/:model/:id', function() {
      var resp;
      before(function(done) {
        request.post('http://localhost:5984/' + db_name, 
          {json: dummyDoc}, function(e,r,b) {
            resp = b;
            done();
          });
      });
      before(function(done) {
        request.post('http://localhost:5984/'  + db_name, 
          {json: {type: 'foo_bar', name: 'child', foo_id: resp.id}}, function(e,r,b) {
            done();
          });
      });

      it('should get a single document', function(done) {
        request.get('http://localhost:3000/api/foo/' + resp.id, 
          {json: true}, function(e,r,b) {
            expect(b).to.be.an('object');
            expect(b.name).to.be('test doc');
            done();
        });
      });
      after(function(done) {
        request.del('http://localhost:5984/' + db_name + '/' + resp.id + '?rev=' + resp.rev, done);
      });
    });

    describe('PUT /api/:model/:id', function() {
      var resp;
      before(function(done) {
        request.post('http://localhost:5984/' + db_name, 
          {json: dummyDoc}, function(e,r,b) {
            resp = b;
            done();
          });
      });
      it('should return array of foo documents', function(done) {
        request.get('http://localhost:3000/api/foo/' + resp.id, { json: true}, updateDoc);
        function updateDoc(err, req, body) {
          var foo = body;
          foo.name = "foobar";
          request.put('http://localhost:3000/api/foo/' + resp.id, 
            { json: foo}, function(e,r,b) {
            resp.rev = b.rev;
            expect(b.ok).to.be.ok();
            done();
          });
        }
      });
      after(function(done) {
        request.del('http://localhost:5984/' + db_name + '/' + resp.id + '?rev=' + resp.rev, done);
      });
    });

    describe('DELETE /api/:model/:id', function() {
      var resp;
      before(function(done) {
        request.post('http://localhost:5984/' + db_name, 
          {json: dummyDoc}, function(e,r,b) {
            resp = b;
            done();
          });
      });
      it('should return array of foo documents', function(done) {
        request.get('http://localhost:3000/api/foo/' + resp.id, { json: true}, deleteDoc);
        function deleteDoc(err, req, body) {
          request.del('http://localhost:3000/api/foo/' + resp.id, 
            { json: body }, function(e,r,b) {
            expect(b.ok).to.be.ok();
            done();
          });
        }
      });
    });
  }
});
