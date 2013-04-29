
var expect = require('chai').expect
  , EventEmitter = require('events').EventEmitter
  , SharedObjectStore = require('../lib/sharedobjectstore').SharedObjectStore
  , SharedObject = require('../lib/sharedobject').SharedObject;

describe('SharedObjectStore', function() {

  var sos, io;

  beforeEach(function() {
    io = {
      sockets: new EventEmitter()
    };
    sos = new SharedObjectStore(io);
  });

  describe('#ctor', function() {
    it('saves io', function() {
      expect(sos.io).to.equal(io);
    });
    it('listens for connections', function() {
      expect(io.sockets._events).to.have.property('connection')
        .and.be.a('function');
    });

    describe('connect/disconnect', function() {
      var socket1, socket2;

      beforeEach(function() {
        socket1 = new EventEmitter();
        socket2 = new EventEmitter();
      });

      it('adds connected sockets', function() {
        io.sockets.emit('connection', socket1);
        io.sockets.emit('connection', socket2);

        expect(sos.sockets).to.have.length(2);
        expect(sos.sockets[0]).to.equal(socket1);
        expect(sos.sockets[1]).to.equal(socket2);
      });

      it('removes disconnected sockets', function() {
        io.sockets.emit('connection', socket1);
        io.sockets.emit('connection', socket2);

        expect(sos.sockets).to.have.length(2);
        expect(sos.sockets[0]).to.equal(socket1);
        expect(sos.sockets[1]).to.equal(socket2);

        socket1.emit('disconnect');
        expect(sos.sockets).to.have.length(1);
        expect(sos.sockets[0]).to.equal(socket2);
      });

    });
  });

  describe('getObject', function() {

    var so, path;

    beforeEach(function() {
      so = {};
      path = '/foo';
      sos.objects[path] = so;
    });

    it('returns an existing object', function(done) {
      sos.getObject(path, function(err, obj) {
        expect(err).to.not.exist;
        expect(obj).to.equal(so);
        done();
      });
    });

    it('returns an error for missing object', function(done) {
      sos.getObject('bar', function(err, obj) {
        expect(err).to.equal('No such object: \'bar\'');
        expect(obj).to.not.exist;
        done();
      });
    });

    it('creates and returns an object for missing object and create=true', function(done) {
      sos.getObject('bar', true, function(err, obj) {
        expect(err).to.not.exist;
        expect(obj).to.be.instanceof(SharedObject);
        done();
      });
    });
  });

});