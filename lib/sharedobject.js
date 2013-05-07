
var _ = require('underscore');

// SharedObject
// -------------
// A server side object synchronizeable via socket.io

var SharedObject = exports.SharedObject = function SharedObject(options) {

  options = ('string' === typeof options) ? { path: options } : options || {};
  options.path = options.path || '/';

  this.options = options;
  this.data = {};
  this.subscribers = [];
};

// ## get(propertyPath, create, fn)
// Get a property from existing data
// If only callback function (fn) is provided, the root object is returned
// If a property and create parameter (boolean) is provided, objects are created
// hierarchially to that point and the final object will be returned
// If only propertyPath and callback function are provided, the existing
// object at that path will be returned. If that object does not exist in the
// hierarchy, an error will be returned
// The callback function (fn) is mandatory and must have the form of function(err, data)
SharedObject.prototype.get = function(propertyPath, create, fn) {
  if('function' === typeof propertyPath) {
    fn = propertyPath;
    create = false;
    propertyPath = null;
  } else if('function' === typeof create) {
    fn = create;
    create = false;
  }

  var current = this.data;
  if(propertyPath) {

    var tokens = (propertyPath instanceof Array) ? propertyPath : propertyPath.split('.');
    var err;

    tokens.forEach(function(prop) {
      if('undefined' === typeof current[prop]) {
        if(create && 'object' === typeof current) {
          current = current[prop] = {};
        } else {
          err = 'Invalid property: \'' + propertyPath + '\'';
          return;
        }
      } else {
        current = current[prop];
      }
    });
  }

  if(err) { fn(err); }
  else { fn(null, current); }

  return this;
};

// ### set
// Get a property on the object
// This will be broadcasted to all subscribers
SharedObject.prototype.set = function(sender, propertyPath, value, fn) {

  var self = this;
  var success = function() {
    self.transmit(sender, propertyPath);
    if(fn) { fn(null, self.data); }
  };
  var fail = function(err) {
    if(fn) { fn(err); }
  }

  if(!propertyPath) {
    self.data = value;
    success();
  } else {
    var tokens = propertyPath.split('.');
    var valueToken = tokens.pop();

    if(!tokens.length) {
      self.data[valueToken] = value;
      success();
    } else {
      this.get(tokens, true, function(err, data) {
        if(err) {
          fail(err);
        } else if('object' !== typeof data) {
          fail('Invalid property: \'' + propertyPath + '\'');
        } else {
          data[valueToken] = value;
          success();
        }
      });
    }
  }

  return this;
};

// ### subscribe
// Add a subscriber (socket.io socket) to the SharedObject
SharedObject.prototype.subscribe = function(socket) {
  this.subscribers.push(socket);

  socket.on('sharedobject-update', _.bind(this.onUpdate, this, socket));
  socket.on('sharedobject-set', _.bind(this.set, this, socket.id));

  return this;
};

SharedObject.prototype.onUpdate = function(socket, path, propertyPath, data) {
  this.data = data;
};

// ###unsubscribe
// Remove a subscriber from the SharedObject
SharedObject.prototype.unsubscribe = function(socket) {
  this.subscribers = _.without(this.subscribers, socket);

  return this;
};

SharedObject.prototype.transmit = function(sender, propertyPath) {
  var path = this.options.path;
  var data = this.data;
  this.subscribers.forEach(function(socket) {
    socket.emit('sharedobject-update', { sender: sender, path: path, propertyPath: propertyPath, data: data });
  });
};
