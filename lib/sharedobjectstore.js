
var _ = require('underscore');

var SharedObject = require('./sharedobject').SharedObject;

// SharedObjectStore
// --------------------
// The shared object store manages all objects for an instance of socket.io
// 
var SharedObjectStore = exports.SharedObjectStore = function SharedObjectStore(io) {
  this.io = io;
  this.sockets = [];
  this.objects = {};

  io.sockets.on('connection', _.bind(this.onConnection, this));
};

SharedObjectStore.prototype.onConnection = function(socket) {
  this.sockets.push(socket);

  socket.on('getObject', _.bind(this.connectToObject, this, socket));
  socket.on('disconnect', _.bind(this.onDisconnect, this, socket));
};

SharedObjectStore.prototype.onDisconnect = function(socket) {
  this.sockets = _.without(this.sockets, socket);
  socket.removeAllListeners();

  /*var dead = [];
  Object.keys(this.objects).forEach(function(key) {

  });*/
};

SharedObjectStore.prototype.connectToObject = function(socket, path, create, fn) {
  this.getObject(path, create, function(err, obj) {
    if(err) { fn(err); }
    else {
      obj.subscribe(socket);
      fn(null, obj);
    }
  });
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
