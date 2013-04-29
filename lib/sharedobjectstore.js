
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

  _.bindAll(this);

  io.sockets.on('connection', this.onConnection);
};

SharedObjectStore.prototype.onConnection = function(socket) {
  this.sockets.push(socket);

  var self = this;

  socket.on('disconnect', function() {
    self.onDisconnect(socket);
  });
};

SharedObjectStore.prototype.onDisconnect = function(socket) {
  this.sockets = _.without(this.sockets, socket);
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
