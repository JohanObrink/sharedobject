
var _ = require('underscore')
  , EventEmitter = require('events').EventEmitter;

var SharedObject = require('./sharedobject').SharedObject;

// SharedObjectStore
// --------------------
// The shared object store manages all objects for an instance of socket.io
// 
var SharedObjectStore = exports.SharedObjectStore = function SharedObjectStore(io) {
  this.io = io;
  this.sockets = [];
  this.objects = {};

  EventEmitter.call(this);

  io.sockets.on('connection', _.bind(this.onConnection, this));
};

SharedObjectStore.prototype = EventEmitter.prototype;

SharedObjectStore.prototype.onConnection = function(socket) {
  this.sockets.push(socket);

  socket.on('getObject', _.bind(this.connectToObject, this, socket));
  socket.on('disconnect', _.bind(this.onDisconnect, this, socket));
};

SharedObjectStore.prototype.onDisconnect = function(socket) {
  this.sockets = _.without(this.sockets, socket);
  socket.removeAllListeners();

  var objectKeys = Object.keys(this.objects);
  for(var i=0; i<objectKeys.length; i++) {
    var key = objectKeys[i];
    var obj = this.objects[key];
    obj.unsubscribe(socket);

    if(!obj.subscribers.length) {
      delete obj;
      delete this.objects[key];
    }
  }
};

SharedObjectStore.prototype.connectToObject = function(socket, path, create, fn) {
  this.getObject(path, create, function(err, obj) {
    if(err) { fn(err); }
    else {
      obj.subscribe(socket);
      fn(null, obj.data);
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
    this.emit('create', obj);
  }

  if(!obj) { fn('No such object: \'' + path + '\''); }
  else { fn(null, obj); }
};
