
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

    var tokens = propertyPath.split('.');
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
};

// ### set
// Get a property on the object
// This will be broadcasted to all subscribers
SharedObject.prototype.set = function(property, value, fn) {

  // Handle different combinations of arguments
  if(arguments.length === 0 || arguments.length === 1 && 'function' === typeof arguments[0]) {
    throw new Error('Insufficient arguments');
  }

  if(arguments.length === 1) {
    value = property;
    property = null;
  } else if(arguments.length === 2 && 'function' === typeof arguments[1]) {
    fn = value;
    value = property;
    property = null;
  }

  if(property === null) {
    this.data = value;
  } else {

    if(property.indexOf('.') === -1) {
      this.data[property] = value;
    } else {

      var tokens = property.split('.');
      var current = this.data;
      var err;

      tokens.slice(0, tokens.length -1).forEach(function(prop) {
        if('undefined' === typeof current[prop]) {
          current = current[prop] = {};
        } else if('object' === typeof current[prop]) {
          current = current[prop];
        } else {
          err = 'Invalid property: \'' + property + '\'';
          return;
        }
      });
      if(!err) { current[tokens[tokens.length -1]] = value; }
    }
  }

  // transmit data to clients
  if(!err) {
    this.transmit(property);
  }

  // if a callback is present, call it with error or data
  if(fn) {
    if(err) { fn(err); }
    else { fn(null, this.data); }
  }

  return this;
};

// ### subscribe
// Add a subscriber (socket.io socket) to the SharedObject
SharedObject.prototype.subscribe = function(socket) {
  this.subscribers.push(socket);

  return this;
};

// ###unsubscribe
// Remove a subscriber from the SharedObject
SharedObject.prototype.unsubscribe = function(socket) {
  this.subscribers = this.subscribers.filter(function(s) {
    return s !== socket;
  });

  return this;
};

SharedObject.prototype.transmit = function(property) {
  var path = this.options.path;
  var data = this.data;
  this.subscribers.forEach(function(socket) {
    socket.emit('sharedobject', { path: path, data: data });
  });
};
