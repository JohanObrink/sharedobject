
(function(exports) {

  var SharedObject = exports.SharedObject = function SharedObject(path) {
    this.path = path;
    this.data = {};
    this.listeners = {};
  };

  SharedObject.prototype.connect = function(socket, fn) {
    this.socket = socket;
    var self = this;
    socket.emit('getObject', this.path, true, function(err, data) {
      this.data = data;
      fn(err, self);
    });

    socket.on('sharedobject-update', function(data) {
      self.data = data.data;
      self.emit('change', data.propertyPath, self.data);
    });

    return this;
  };

  SharedObject.prototype.set = function(propertyPath, value, fn) {
    var self = this;
    this.socket.emit('sharedobject-set', propertyPath, value, function(err, data) {
      if(err) { fn(err); }
      else {
        self.data = data;
        fn(null, self.data);
      }
    });
    return this;
  };

  SharedObject.prototype.addListener = function(event, listener) {

    if(!this.listeners[event]) {
      this.listeners[event] = listener;
    } else if(this.listeners[event] instanceof Array) {
      this.listeners[event].push(listener);
    } else {
      var oldListener = this.listeners[event];
      this.listeners[event] = [ oldListener, listener ];
    }

    return this;
  };

  SharedObject.prototype.on = function(event, listener) {
    return this.addListener(event, listener);
  };

  SharedObject.prototype.removeListener = function(event, listener) {

    if(this.listeners[event]) {
      if(this.listeners[event] instanceof Array) {
        this.listeners[event] = this.listeners[event].filter(function(l) {
          return l !== listener;
        });
        if(this.listeners[event].length === 1) {
          this.listeners[event] = this.listeners[event][0];
        } else if(this.listeners[event].length === 0) {
          delete this.listeners[event];
        }
      } else if(this.listeners[event] === listener) {
        delete this.listeners[event];
      }
    }

    return this;
  };

  SharedObject.prototype.removeAllListeners = function(event) {

    if(event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }

    return this;
  };

  SharedObject.prototype.emit = function(event) {
    if(this.listeners[event]) {
      var listeners = (this.listeners[event] instanceof Array) ? this.listeners[event] : [ this.listeners[event] ];
      var args = Array.prototype.slice.call(arguments, 1);
      listeners.forEach(function(l) {
        l.apply(null, args);
      });
    }

    return this;
  };

})(exports||window);