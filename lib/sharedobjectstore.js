
var SharedObject = require('./sharedobject').SharedObject;

// SharedObjectStore
// --------------------
// The shared object store manages all objects for an instance of socket.io
// 
var SharedObjectStore = exports.SharedObjectStore = function SharedObjectStore(io) {
  this.io = io;
  this.objects = {};
};

SharedObjectStore.prototype.getObject = function(path, create, fn) {
  if('function' === typeof create) {
    fn = create;
    create = false;
  }

  var obj = this.objects[path];
  if(!obj && create) {
    obj = this.objects[path] = new SharedObject(path);
  }

  if(!obj) { fn('No such object: \'' + path + '\''); }
  else { fn(null, obj); }
};
