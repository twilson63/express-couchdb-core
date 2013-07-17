var expect = require('expect.js');
var express = require('express');
var app = express();
var core = require('../');

app.use(express.bodyParser());
app.use(core({
  couch: 'http://localhost:5984/foo'
}));
app.listen(3000);

var request = require('request');
var server = 'http://localhost:3000';
var init = require('../init');
var dummyDoc = { name: 'test doc', type: 'foo'};

describe('Core Api', function() {
  before(function(done) {
    request.put('http://localhost:5984/foo', done);
    // init views
    init('http://localhost:5984/foo');
  });
  after(function(done) {
    request.del('http://localhost:5984/foo', done);
  });
  // # Couch Core API
  describe('POST /api/:model', function() {
    var resp;
    it('should be ok', function(done) {
      request.post([server,'api','foo'].join('/'), {json: { name: 'bar'}}, function(e,r,b) {
        resp = b;
        expect(b.ok).to.be.ok();
        done();
      });
    });
    after(function(done) {
      request.del('http://localhost:5984/foo/' + resp.id + '?rev=' + resp.rev, done);
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
      request.del('http://localhost:5984/foo/' + resp.id + '?rev=' + resp.rev, done);
    });
  });
  
  describe('GET /api/:model/:id', function() {
    var resp;
    before(function(done) {
      request.post('http://localhost:5984/foo', 
        {json: dummyDoc}, function(e,r,b) {
          resp = b;
          done();
        });
    });
    before(function(done) {
      request.post('http://localhost:5984/foo', 
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
      request.del('http://localhost:5984/foo/' + resp.id + '?rev=' + resp.rev, done);
    });
  });

  describe('PUT /api/:model/:id', function() {
    var resp;
    before(function(done) {
      request.post('http://localhost:5984/foo', 
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
      request.del('http://localhost:5984/foo/' + resp.id + '?rev=' + resp.rev, done);
    });
  });

  describe('DELETE /api/:model/:id', function() {
    var resp;
    before(function(done) {
      request.post('http://localhost:5984/foo', 
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
});
