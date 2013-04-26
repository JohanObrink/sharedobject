
var SharedObject = exports.SharedObject = function SharedObject(options) {

  options = ('string' === typeof options) ? { path: options } : options || {};
  options.path = options.path || '/';

  this.options = options;
  this.data = {};
  this.subscribers = [];
};

SharedObject.prototype.set = function(property, value, fn) {

  if(value === undefined) {
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

      tokens.slice(0, tokens.length -1).forEach(function(prop) {
        if('undefined' === typeof current[prop]) {
          current = current[prop] = {};
        } else if('object' === typeof current[prop]) {
          current = current[prop];
        } else {
          fn('Invalid property: \'' + property + '\'');
        }
      });
      current[tokens[tokens.length -1]] = value;

      fn(null, this.data);
    }
  }

  return this;
};

SharedObject.prototype.subscribe = function(client) {
  this.subscribers.push(client);

  return this;
};

SharedObject.prototype.unsubscribe = function(client) {
  this.subscribers = this.subscribers.filter(function(c) {
    return c !== client;
  });

  return this;
};