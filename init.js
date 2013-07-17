// the purpose of this script 
// is to create a couch db design doc 
// and view for the model list functionality
var nano = require('nano');

var all = function(doc) {
  emit(doc.type, doc);
};

var get = function(doc) {
   if (/_/.test(doc.type)) {
     var parentDoc = doc.type.split('_')[0]; 
     emit([
          parentDoc, 
          doc[parentDoc + '_id']
      ], doc);
  } else {
    emit([
      doc.type,
      doc._id
    ], doc);
  }
};

module.exports = init = function(couch) {
  var db = nano(couch);
  db.insert({
    type: 'javascript',
    version: "0.0.1",
    views: {
      all: {
        map: all.toString()
      },
      get: {
        map: get.toString()
      }
    }},'_design/model',
    function(err, body) {
      if(!module.parent) {
        console.log(body);
      }
    })
}

if (!module.parent) {
  if (process.argv[2]) { 
    init(process.argv[2]);
  } else {
    console.log('couchdb url required');
  }
}
